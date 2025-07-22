import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/create-user-by-admin.dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory')
  @ApiOperation({ summary: 'Get comprehensive inventory report' })
  @ApiResponse({
    status: 200,
    description: 'Inventory report retrieved successfully',
  })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get comprehensive sales report' })
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

    return this.reportsService.getSalesReport(start, end);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial report' })
  @ApiQuery({ name: 'startDate', required: false, type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
  })
  getFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.reportsService.getFinancialReport(start, end);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get activity report' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Number of days to look back',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity report retrieved successfully',
  })
  getActivityReport(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    return this.reportsService.getActivityReport(days);
  }
}
