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
import { SalesService } from './sales.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/create-user-by-admin.dto';

@ApiTags('Sales Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Customer Management
  @Post('customers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
  })
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.salesService.createCustomer(createCustomerDto);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get all customers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
  })
  findAllCustomers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.salesService.findAllCustomers(page, limit);
  }

  @Get('customers/:id')
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
  })
  findCustomerById(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findCustomerById(id);
  }

  @Patch('customers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
  })
  updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.salesService.updateCustomer(id, updateCustomerDto);
  }

  @Delete('customers/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
  })
  deleteCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.deleteCustomer(id);
  }

  // Order Management
  @Post('orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.salesService.createOrder(createOrderDto, req.user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  findAllOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.salesService.findAllOrders(page, limit, status);
  }

  @Get('orders/:id')
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  findOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOrderById(id);
  }

  @Patch('orders/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
  })
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.salesService.updateOrderStatus(id, updateOrderDto);
  }

  @Post('orders/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
  })
  cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.salesService.cancelOrder(id, req.user.id);
  }

  // Payment Management
  @Post('orders/:id/payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP)
  @ApiParam({ name: 'id', type: 'number', description: 'Order ID' })
  @ApiOperation({ summary: 'Add payment to order' })
  @ApiResponse({
    status: 201,
    description: 'Payment added successfully',
  })
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPaymentDto: AddPaymentDto,
  ) {
    return this.salesService.addPayment(id, addPaymentDto);
  }

  // Reports and Analytics
  @Get('reports/sales')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Sales report retrieved successfully',
  })
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.salesService.getSalesReport(start, end);
  }

  @Get('reports/top-products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Top selling products retrieved successfully',
  })
  getTopSellingProducts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.salesService.getTopSellingProducts(start, end, limit);
  }
}
