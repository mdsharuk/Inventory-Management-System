import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/create-user-by-admin.dto';

@ApiTags('Inventory Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get inventory dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  getDashboard() {
    return this.inventoryService.getDashboardStats();
  }

  // Product Management
  @Post('products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CLERK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CLERK)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.createProduct(createProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
  })
  @ApiQuery({ name: 'categoryId', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  findAllProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('categoryId', new DefaultValuePipe(0), ParseIntPipe)
    categoryId?: number,
  ) {
    return this.inventoryService.findAllProducts(
      page,
      limit,
      status as any,
      categoryId || undefined,
    );
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Get products with low stock levels' })
  @ApiResponse({
    status: 200,
    description: 'Low stock products retrieved successfully',
  })
  getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('products/:id')
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  findProductById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findProductById(id);
  }

  @Patch('products/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CLERK)
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteProduct(id);
  }

  // Stock Management
  @Post('products/:id/adjust-stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CLERK)
  @ApiParam({ name: 'id', type: 'number', description: 'Product ID' })
  @ApiOperation({ summary: 'Adjust product stock' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
  })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() stockAdjustmentDto: StockAdjustmentDto,
    @Request() req: any,
  ) {
    return this.inventoryService.adjustStock(
      id,
      stockAdjustmentDto,
      req.user.id,
    );
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Get stock movements history' })
  @ApiQuery({ name: 'productId', required: false, type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Stock movements retrieved successfully',
  })
  getStockMovements(
    @Query('productId', new DefaultValuePipe(0), ParseIntPipe)
    productId?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.inventoryService.getStockMovements(
      productId || undefined,
      page,
      limit,
    );
  }

  // Category Management
  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.inventoryService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  findAllCategories() {
    return this.inventoryService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  findCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.inventoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Category ID' })
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteCategory(id);
  }

  // Supplier Management
  @Post('suppliers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
  })
  createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(createSupplierDto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiResponse({
    status: 200,
    description: 'Suppliers retrieved successfully',
  })
  findAllSuppliers() {
    return this.inventoryService.findAllSuppliers();
  }

  @Get('suppliers/:id')
  @ApiParam({ name: 'id', type: 'number', description: 'Supplier ID' })
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier retrieved successfully',
  })
  findSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findSupplierById(id);
  }

  @Patch('suppliers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Supplier ID' })
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
  })
  updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.inventoryService.updateSupplier(id, updateSupplierDto);
  }

  @Delete('suppliers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Supplier ID' })
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deleted successfully',
  })
  deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteSupplier(id);
  }
}
