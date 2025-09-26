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
} from '@nestjs/common';
import { SponsorsService } from './sponsors.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';
import { SponsorTier } from '@shared/types/sponsor.types';

@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createSponsorDto: any) {
    return this.sponsorsService.create(createSponsorDto);
  }

  @Get()
  @Public()
  findAll(@Query('tier') tier?: SponsorTier) {
    if (tier) {
      return this.sponsorsService.findByTier(tier);
    }
    return this.sponsorsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateSponsorDto: any) {
    return this.sponsorsService.update(id, updateSponsorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.sponsorsService.remove(id);
  }
}
