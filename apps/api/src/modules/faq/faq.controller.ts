import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqFilterDto } from './dto/faq-filter.dto';
import { CreateFaqCategoryDto } from './dto/create-faq-category.dto';
import { UpdateFaqCategoryDto } from './dto/update-faq-category.dto';
import { ApiResponse } from '@common/dto/api-response.dto';
import { Request } from 'express';

@ApiTags('FAQ')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // FAQ endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new FAQ item (Admin/Producer only)' })
  @ApiBody({ type: CreateFaqDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'FAQ created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          question: { 'pt-BR': 'Pergunta?', en: 'Question?' },
          answer: { 'pt-BR': 'Resposta...', en: 'Answer...' },
          category: '507f1f77bcf86cd799439012',
          order: 1,
          viewCount: 0,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  async create(@Body() createFaqDto: CreateFaqDto) {
    const faq = await this.faqService.createFaq(createFaqDto);
    return ApiResponse.success(faq);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all FAQ items with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'order,-viewCount' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in question and answer',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({ name: 'tags', required: false, type: [String], description: 'Filter by tags' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of FAQ items with pagination',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            question: { 'pt-BR': 'Como participar?', en: 'How to participate?' },
            answer: { 'pt-BR': 'Resposta...', en: 'Answer...' },
            category: {
              _id: '507f1f77bcf86cd799439012',
              name: { 'pt-BR': 'Geral', en: 'General' },
            },
            viewCount: 150,
          },
        ],
        metadata: {
          total: 30,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  async findAll(@Query() filterDto: FaqFilterDto) {
    const result = await this.faqService.findAllFaqs(filterDto);
    return ApiResponse.success(result.data, result.metadata);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get most popular FAQ items' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of items to return',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of popular FAQ items sorted by view count',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            question: { 'pt-BR': 'Pergunta popular', en: 'Popular question' },
            viewCount: 500,
          },
        ],
      },
    },
  })
  async findPopular(@Query('limit') limit?: number) {
    const faqs = await this.faqService.findPopularFaqs(limit);
    return ApiResponse.success(faqs);
  }

  // FAQ Category endpoints - MUST come before :id routes
  @ApiTags('FAQ Categories')
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new FAQ category (Admin/Producer only)' })
  @ApiBody({ type: CreateFaqCategoryDto })
  @SwaggerApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439012',
          name: { 'pt-BR': 'Inscrições', en: 'Registration' },
          description: { 'pt-BR': 'Perguntas sobre inscrições', en: 'Registration questions' },
          icon: 'ticket',
          order: 1,
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  async createCategory(@Body() createCategoryDto: CreateFaqCategoryDto) {
    const category = await this.faqService.createCategory(createCategoryDto);
    return ApiResponse.success(category);
  }

  @ApiTags('FAQ Categories')
  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List all FAQ categories' })
  @SwaggerApiResponse({
    status: 200,
    description: 'List of FAQ categories',
    schema: {
      example: {
        success: true,
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: { 'pt-BR': 'Geral', en: 'General' },
            description: { 'pt-BR': 'Perguntas gerais', en: 'General questions' },
            faqCount: 15,
            order: 1,
          },
        ],
      },
    },
  })
  async findAllCategories() {
    const categories = await this.faqService.findAllCategories();
    return ApiResponse.success(categories);
  }

  @ApiTags('FAQ Categories')
  @Get('categories/:id')
  @Public()
  @ApiOperation({ summary: 'Get FAQ category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Category details with FAQs',
  })
  @SwaggerApiResponse({ status: 404, description: 'Category not found' })
  async findOneCategory(@Param('id') id: string) {
    const category = await this.faqService.findCategoryById(id);
    return ApiResponse.success(category);
  }

  @ApiTags('FAQ Categories')
  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update FAQ category (Admin/Producer only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateFaqCategoryDto })
  @SwaggerApiResponse({ status: 200, description: 'Category updated successfully' })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateFaqCategoryDto) {
    const category = await this.faqService.updateCategory(id, updateCategoryDto);
    return ApiResponse.success(category);
  }

  @ApiTags('FAQ Categories')
  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete FAQ category (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @SwaggerApiResponse({ status: 204, description: 'Category deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'Category not found' })
  @SwaggerApiResponse({ status: 409, description: 'Cannot delete category with existing FAQs' })
  async removeCategory(@Param('id') id: string) {
    await this.faqService.removeCategory(id);
  }

  // FAQ items with :id param routes - MUST come after specific routes
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get FAQ item by ID' })
  @ApiParam({ name: 'id', description: 'FAQ ID', example: '507f1f77bcf86cd799439011' })
  @SwaggerApiResponse({
    status: 200,
    description: 'FAQ item details',
    schema: {
      example: {
        success: true,
        data: {
          _id: '507f1f77bcf86cd799439011',
          question: { 'pt-BR': 'Pergunta completa?', en: 'Complete question?' },
          answer: { 'pt-BR': '<p>Resposta em HTML...</p>', en: '<p>HTML answer...</p>' },
          category: { _id: '507f1f77bcf86cd799439012', name: { 'pt-BR': 'Geral', en: 'General' } },
          tags: ['registration', 'tickets'],
          viewCount: 250,
          relatedFaqs: ['507f1f77bcf86cd799439013'],
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 404, description: 'FAQ not found' })
  async findOne(@Param('id') id: string) {
    const faq = await this.faqService.findFaqById(id);
    return ApiResponse.success(faq);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update FAQ item (Admin/Producer only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiBody({ type: UpdateFaqDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'FAQ updated successfully',
  })
  @SwaggerApiResponse({ status: 400, description: 'Validation error' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'FAQ not found' })
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    const faq = await this.faqService.updateFaq(id, updateFaqDto);
    return ApiResponse.success(faq);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete FAQ item (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for deletion' })
  @SwaggerApiResponse({ status: 204, description: 'FAQ deleted successfully' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'FAQ not found' })
  async remove(@Param('id') id: string, @Req() req: Request, @Query('reason') reason?: string) {
    const userId = (req as any).user?.id;
    await this.faqService.removeFaq(id, reason, userId);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore soft-deleted FAQ item (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'FAQ ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'FAQ restored successfully',
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @SwaggerApiResponse({ status: 404, description: 'FAQ not found' })
  async restore(@Param('id') id: string) {
    const faq = await this.faqService.restoreFaq(id);
    return ApiResponse.success(faq);
  }
}
