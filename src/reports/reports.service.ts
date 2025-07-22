import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getInventoryReport() {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      totalCostValue,
      categoryBreakdown,
      stockMovementsSummary,
    ] = await Promise.all([
      // Total products
      this.prisma.product.count(),

      // Active products
      this.prisma.product.count({
        where: { status: 'ACTIVE' },
      }),

      // Low stock products (stock <= minStock)
      this.prisma.product.count({
        where: {
          AND: [{ minStock: { gt: 0 } }, { status: 'ACTIVE' }],
        },
      }),

      // Out of stock products
      this.prisma.product.count({
        where: {
          stock: 0,
          status: 'ACTIVE',
        },
      }),

      // Total stock value (selling price)
      this.prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _sum: {
          stock: true,
        },
      }),

      // Total cost value
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          stock: true,
          costPrice: true,
        },
      }),

      // Category breakdown
      this.prisma.category.findMany({
        include: {
          _count: {
            select: { products: true },
          },
          products: {
            where: { status: 'ACTIVE' },
            select: {
              stock: true,
              price: true,
              costPrice: true,
            },
          },
        },
      }),

      // Recent stock movements
      this.prisma.stockMovement.groupBy({
        by: ['movementType'],
        _count: {
          movementType: true,
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    // Calculate total cost value
    const totalCostVal = totalCostValue.reduce(
      (sum, product) => sum + product.stock * Number(product.costPrice),
      0,
    );

    // Process category breakdown
    const categoryStats = categoryBreakdown.map((category) => ({
      categoryName: category.name,
      productCount: category._count.products,
      totalStock: category.products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: category.products.reduce(
        (sum, p) => sum + p.stock * Number(p.price),
        0,
      ),
      totalCostValue: category.products.reduce(
        (sum, p) => sum + p.stock * Number(p.costPrice),
        0,
      ),
    }));

    return {
      summary: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockQuantity: totalStockValue._sum.stock || 0,
        totalStockValue: categoryStats.reduce(
          (sum, cat) => sum + cat.totalValue,
          0,
        ),
        totalCostValue: totalCostVal,
        potentialProfit:
          categoryStats.reduce((sum, cat) => sum + cat.totalValue, 0) -
          totalCostVal,
      },
      categoryBreakdown: categoryStats,
      stockMovements: {
        last30Days: stockMovementsSummary,
      },
    };
  }

  async getSalesReport(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = startDate;
      if (endDate) dateFilter.orderDate.lte = endDate;
    }

    const [
      totalOrders,
      totalRevenue,
      totalCost,
      ordersByStatus,
      paymentsByMethod,
      dailySales,
      topCustomers,
      topProducts,
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count({
        where: {
          ...dateFilter,
          status: { not: 'CANCELLED' },
        },
      }),

      // Total revenue
      this.prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: { not: 'CANCELLED' },
        },
        _sum: { finalAmount: true },
      }),

      // Total cost (approximation based on order items)
      this.prisma.orderItem.findMany({
        where: {
          order: {
            ...dateFilter,
            status: { not: 'CANCELLED' },
          },
        },
        include: {
          product: {
            select: { costPrice: true },
          },
        },
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { status: true },
        _sum: { finalAmount: true },
      }),

      // Payments by method
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          order: dateFilter,
        },
        _count: { paymentMethod: true },
        _sum: { amount: true },
      }),

      // Daily sales (last 30 days or specified period)
      this.getDailySalesData(startDate, endDate),

      // Top customers
      this.getTopCustomers(startDate, endDate),

      // Top products
      this.getTopProducts(startDate, endDate),
    ]);

    // Calculate total cost
    const totalCostAmount = totalCost.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0,
    );

    return {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
        totalCost: totalCostAmount,
        grossProfit:
          Number(totalRevenue._sum.finalAmount || 0) - totalCostAmount,
        averageOrderValue:
          totalOrders > 0
            ? Number(totalRevenue._sum.finalAmount || 0) / totalOrders
            : 0,
      },
      ordersByStatus,
      paymentsByMethod,
      dailySales,
      topCustomers,
      topProducts,
    };
  }

  async getFinancialReport(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = startDate;
      if (endDate) dateFilter.orderDate.lte = endDate;
    }

    const [revenue, expenses, payments, inventoryValue] = await Promise.all([
      // Revenue from completed orders
      this.prisma.order.aggregate({
        where: {
          ...dateFilter,
          status: { in: ['DELIVERED', 'SHIPPED'] },
        },
        _sum: { finalAmount: true },
      }),

      // Expenses (purchase orders)
      this.prisma.purchaseOrder.aggregate({
        where: {
          orderDate: dateFilter.orderDate,
          status: 'RECEIVED',
        },
        _sum: { totalAmount: true },
      }),

      // Payments received
      this.prisma.payment.aggregate({
        where: {
          paymentDate: dateFilter.orderDate,
        },
        _sum: { amount: true },
      }),

      // Current inventory value
      this.getCurrentInventoryValue(),
    ]);

    const totalRevenue = revenue._sum.finalAmount || 0;
    const totalExpenses = expenses._sum.totalAmount || 0;
    const totalPayments = payments._sum.amount || 0;

    return {
      revenue: {
        totalRevenue,
        paymentsReceived: totalPayments,
        pendingPayments: Number(totalRevenue) - Number(totalPayments),
      },
      expenses: {
        totalExpenses,
        inventory: inventoryValue,
      },
      profitLoss: {
        grossProfit: Number(totalRevenue) - Number(totalExpenses),
        netProfit: Number(totalPayments) - Number(totalExpenses),
      },
    };
  }

  private async getDailySalesData(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    return this.prisma.order.groupBy({
      by: ['orderDate'],
      where: {
        orderDate: {
          gte: start,
          lte: end,
        },
        status: { not: 'CANCELLED' },
      },
      _count: { id: true },
      _sum: { finalAmount: true },
      orderBy: { orderDate: 'asc' },
    });
  }

  private async getTopCustomers(
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = startDate;
      if (endDate) dateFilter.orderDate.lte = endDate;
    }

    const topCustomers = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        ...dateFilter,
        customerId: { not: null },
        status: { not: 'CANCELLED' },
      },
      _count: { id: true },
      _sum: { finalAmount: true },
      orderBy: {
        _sum: { finalAmount: 'desc' },
      },
      take: limit,
    });

    // Get customer details
    const customersWithDetails = await Promise.all(
      topCustomers.map(async (customerOrder) => {
        const customer = await this.prisma.customer.findUnique({
          where: { id: customerOrder.customerId! },
          select: { id: true, name: true, email: true },
        });

        return {
          customer,
          totalOrders: customerOrder._count.id,
          totalSpent: customerOrder._sum.finalAmount,
        };
      }),
    );

    return customersWithDetails;
  }

  private async getTopProducts(
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.order = {
        orderDate: {},
      };
      if (startDate) dateFilter.order.orderDate.gte = startDate;
      if (endDate) dateFilter.order.orderDate.lte = endDate;
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        ...dateFilter,
        order: {
          ...dateFilter.order,
          status: { not: 'CANCELLED' },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: limit,
    });

    // Get product details
    const productsWithDetails = await Promise.all(
      topProducts.map(async (productSale) => {
        const product = await this.prisma.product.findUnique({
          where: { id: productSale.productId },
          select: { id: true, name: true, sku: true },
        });

        return {
          product,
          totalQuantitySold: productSale._sum.quantity,
          totalRevenue: productSale._sum.totalPrice,
        };
      }),
    );

    return productsWithDetails;
  }

  private async getCurrentInventoryValue() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        stock: true,
        price: true,
        costPrice: true,
      },
    });

    return {
      totalStockValue: products.reduce(
        (sum, p) => sum + p.stock * Number(p.price),
        0,
      ),
      totalCostValue: products.reduce(
        (sum, p) => sum + p.stock * Number(p.costPrice),
        0,
      ),
    };
  }

  async getActivityReport(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      recentOrders,
      recentStockMovements,
      recentPayments,
      recentInventoryAdjustments,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),

      this.prisma.stockMovement.count({
        where: { createdAt: { gte: startDate } },
      }),

      this.prisma.payment.count({
        where: { createdAt: { gte: startDate } },
      }),

      this.prisma.inventoryAdjustment.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      period: `Last ${days} days`,
      summary: {
        newOrders: recentOrders,
        stockMovements: recentStockMovements,
        payments: recentPayments,
        inventoryAdjustments: recentInventoryAdjustments,
      },
    };
  }
}
