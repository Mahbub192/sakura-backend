import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../../entities';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const clinic = this.clinicRepository.create(createClinicDto);
    return this.clinicRepository.save(clinic);
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicRepository.find({
      order: { locationName: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { id },
      relations: ['appointments'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async update(id: number, updateClinicDto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.findOne(id);
    Object.assign(clinic, updateClinicDto);
    return this.clinicRepository.save(clinic);
  }

  async remove(id: number): Promise<void> {
    const clinic = await this.findOne(id);
    await this.clinicRepository.remove(clinic);
  }

  async findByCity(city: string): Promise<Clinic[]> {
    return this.clinicRepository.find({
      where: { city },
      order: { locationName: 'ASC' },
    });
  }
}


