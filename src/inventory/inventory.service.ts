import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

// Import enums from Prisma client
import { 
  StockMovementType, 
  InventoryAdjustmentType 
} from '@prisma/client';
@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Product Management
  async createProduct(createProductDto: CreateProductDto) {
    const { categoryId, supplierId, ...productData } = createProductDto;

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${supplierId} not found`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        categoryId,
        supplierId,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Create initial stock movement record
    if (product.stock > 0) {
      await this.createStockMovement({
        productId: product.id,
        movementType: StockMovementType.IN,
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reference: 'Initial Stock',
        notes: 'Initial product stock entry',
      });
    }

    return product;
  }

  async findAllProducts(
    page: number = 1,
    limit: number = 10,
    status?: ProductStatus,
    categoryId?: number,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          _count: {
            select: {
              stockMovements: true,
              orderItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findProductById(id);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        supplier: true,
      },
    });

    return updatedProduct;
  }

  async deleteProduct(id: number) {
    const product = await this.findProductById(id);

    // Check if product has any orders
    const orderItems = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItems > 0) {
      throw new BadRequestException(
        'Cannot delete product with existing orders',
      );
    }

    return this.prisma.product.delete({ where: { id } });
  }

  // Stock Management
  async adjustStock(
    id: number,
    stockAdjustmentDto: StockAdjustmentDto,
    userId: number,
  ) {
    const { quantity, reason, notes, type } = stockAdjustmentDto;

    const product = await this.findProductById(id);
    const currentStock = product.stock;
    let newStock: number;
    let adjustmentType: InventoryAdjustmentType;
    let movementType: StockMovementType;

    if (type === 'increase') {
      newStock = currentStock + quantity;
      adjustmentType = InventoryAdjustmentType.INCREASE;
      movementType = StockMovementType.IN;
    } else {
      if (currentStock < quantity) {
        throw new BadRequestException('Insufficient stock for adjustment');
      }
      newStock = currentStock - quantity;
      adjustmentType = InventoryAdjustmentType.DECREASE;
      movementType = StockMovementType.OUT;
    }

    // Update product stock
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    // Create inventory adjustment record
    await this.prisma.inventoryAdjustment.create({
      data: {
        productId: id,
        adjustmentType,
        quantity,
        reason,
        notes,
        userId,
      },
    });

    // Create stock movement record
    await this.createStockMovement({
      productId: id,
      movementType,
      quantity,
      previousStock: currentStock,
      newStock,
      reference: 'Manual Adjustment',
      notes: reason,
      userId,
    });

    return updatedProduct;
  }

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { stock: { lte: this.prisma.product.fields.minStock } },
          {
            AND: [
              { minStock: { gt: 0 } },
              { stock: { lte: this.prisma.product.fields.minStock } },
            ],
          },
        ],
        status: ProductStatus.ACTIVE,
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { stock: 'asc' },
    });
  }

  // Category Management
  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findCategoryById(id);

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async deleteCategory(id: number) {
    const category = await this.findCategoryById(id);

    // Check if category has products
    const products = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (products > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing products',
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  // Supplier Management
  async createSupplier(createSupplierDto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAllSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            products: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findSupplierById(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async updateSupplier(id: number, updateSupplierDto: UpdateSupplierDto) {
    await this.findSupplierById(id);

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async deleteSupplier(id: number) {
    const supplier = await this.findSupplierById(id);

    // Check if supplier has products or purchase orders
    const [products, purchaseOrders] = await Promise.all([
      this.prisma.product.count({ where: { supplierId: id } }),
      this.prisma.purchaseOrder.count({ where: { supplierId: id } }),
    ]);

    if (products > 0 || purchaseOrders > 0) {
      throw new BadRequestException(
        'Cannot delete supplier with existing products or purchase orders',
      );
    }

    return this.prisma.supplier.delete({ where: { id } });
  }

  // Stock Movement Tracking
  private async createStockMovement(data: {
    productId: number;
    movementType: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost?: number;
    reference?: string;
    notes?: string;
    userId?: number;
  }) {
    return this.prisma.stockMovement.create({
      data,
    });
  }

  async getStockMovements(
    productId?: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Dashboard & Analytics
  async getDashboardStats() {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalStockValue,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      this.prisma.product.count({
        where: {
          AND: [
            { minStock: { gt: 0 } },
            { stock: { lte: this.prisma.product.fields.minStock } },
            { status: ProductStatus.ACTIVE },
          ],
        },
      }),
      this.prisma.category.count(),
      this.prisma.supplier.count(),
      this.prisma.product.aggregate({
        _sum: {
          stock: true,
        },
        where: { status: ProductStatus.ACTIVE },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalStockQuantity: totalStockValue._sum.stock || 0,
    };
  }
}
