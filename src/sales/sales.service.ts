import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // Customer Management
  async createCustomer(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAllCustomers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        include: {
          _count: {
            select: { orders: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCustomerById(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async updateCustomer(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findCustomerById(id);

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async deleteCustomer(id: number) {
    const customer = await this.findCustomerById(id);

    // Check if customer has orders
    const orders = await this.prisma.order.count({
      where: { customerId: id },
    });

    if (orders > 0) {
      throw new BadRequestException(
        'Cannot delete customer with existing orders',
      );
    }

    return this.prisma.customer.delete({ where: { id } });
  }

  // Order Management
  async createOrder(createOrderDto: CreateOrderDto, userId: number) {
    const { customerId, items, discount = 0, tax = 0, notes } = createOrderDto;

    // Verify customer exists if provided
    if (customerId) {
      await this.findCustomerById(customerId);
    }

    // Verify products exist and calculate totals
    let totalAmount = 0;
    const orderItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      const unitPrice = Number(item.unitPrice ?? product.price);
      const quantity = Number(item.quantity);
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity,
        unitPrice,
        totalPrice: itemTotal,
      });
    }

    const finalAmount = totalAmount - discount + tax;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items in a transaction
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          totalAmount,
          discount,
          tax,
          finalAmount,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      });

      // Update product stock and create stock movements
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found during order creation`,
          );
        }

        const newStock = product.stock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: 'OUT',
            quantity: item.quantity,
            previousStock: product.stock,
            newStock,
            unitCost: product.costPrice,
            reference: `Order ${orderNumber}`,
            notes: `Sale order - ${orderNumber}`,
            userId,
          },
        });
      }

      return order;
    });
  }

  async findAllOrders(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          _count: {
            select: { payments: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOrderById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unitOfMeasure: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Calculate payment summary
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const remainingAmount = Number(order.finalAmount) - totalPaid;

    return {
      ...order,
      paymentSummary: {
        totalPaid,
        remainingAmount,
        isPaid: remainingAmount <= 0,
      },
    };
  }

  async updateOrderStatus(id: number, updateOrderDto: UpdateOrderDto) {
    await this.findOrderById(id);

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async cancelOrder(id: number, userId: number) {
    const order = await this.findOrderById(id);

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      throw new BadRequestException(
        'Can only cancel pending or processing orders',
      );
    }

    // Revert stock changes in a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Revert stock for each item
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found during order cancellation`,
          );
        }

        const newStock = product.stock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            movementType: 'IN',
            quantity: item.quantity,
            previousStock: product.stock,
            newStock,
            reference: `Order Cancelled ${order.orderNumber}`,
            notes: `Stock restored due to order cancellation - ${order.orderNumber}`,
            userId,
          },
        });
      }

      return { message: 'Order cancelled successfully' };
    });
  }

  // Payment Management
  async addPayment(orderId: number, addPaymentDto: AddPaymentDto) {
    const order = await this.findOrderById(orderId);

    // Calculate remaining amount
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const remainingAmount = Number(order.finalAmount) - totalPaid;

    if (addPaymentDto.amount > remainingAmount) {
      throw new BadRequestException(
        `Payment amount exceeds remaining balance. Remaining: ${remainingAmount}`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        ...addPaymentDto,
        orderId,
      },
    });

    // Update order status if fully paid
    const newTotalPaid = totalPaid + addPaymentDto.amount;
    if (newTotalPaid >= Number(order.finalAmount)) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paidDate: new Date(),
          status: order.status === 'PENDING' ? 'PROCESSING' : order.status,
        },
      });
    }

    return payment;
  }

  // Reports and Analytics
  async getSalesReport(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = startDate;
      if (endDate) where.orderDate.lte = endDate;
    }

    const [
      totalOrders,
      totalRevenue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
      this.getTopSellingProducts(startDate, endDate),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      averageOrderValue:
        totalOrders > 0
          ? Number(totalRevenue._sum.finalAmount || 0) / totalOrders
          : 0,
      topProducts,
    };
  }

  async getTopSellingProducts(
    startDate?: Date,
    endDate?: Date,
    limit: number = 10,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.order = {
        orderDate: {},
      };
      if (startDate) where.order.orderDate.gte = startDate;
      if (endDate) where.order.orderDate.lte = endDate;
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true },
        });

        return {
          product,
          totalQuantitySold: item._sum.quantity,
          totalRevenue: item._sum.totalPrice,
        };
      }),
    );

    return productsWithDetails;
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const prefix = `ORD-${year}${month}${day}`;

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = lastOrder.orderNumber.split('-')[1];
      const lastNumber = parseInt(lastSequence.slice(-3));
      sequence = lastNumber + 1;
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }
}
