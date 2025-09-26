import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@shared/types/user.types';
import { Public } from '@common/decorators/public.decorator';

@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  create(@Body() createSpeakerDto: any) {
    return this.speakersService.create(createSpeakerDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.speakersService.findAll();
  }

  @Get('highlights')
  @Public()
  findHighlights() {
    return this.speakersService.findHighlights();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.speakersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCER)
  update(@Param('id') id: string, @Body() updateSpeakerDto: any) {
    return this.speakersService.update(id, updateSpeakerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.speakersService.remove(id);
  }
}
