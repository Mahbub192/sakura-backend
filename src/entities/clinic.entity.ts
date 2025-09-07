import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from './appointment.entity';

@Entity('clinics')
export class Clinic {
  @ApiProperty({ description: 'Unique clinic identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Clinic name' })
  @Column({ type: 'varchar' })
  locationName: string;

  @ApiProperty({ description: 'Clinic address' })
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ description: 'Clinic city' })
  @Column({ type: 'varchar' })
  city: string;

  @ApiProperty({ description: 'Clinic state/province' })
  @Column({ type: 'varchar' })
  state: string;

  @ApiProperty({ description: 'Clinic postal code' })
  @Column({ type: 'varchar' })
  postalCode: string;

  @ApiProperty({ description: 'Clinic phone number' })
  @Column({ type: 'varchar' })
  phone: string;

  @ApiProperty({ description: 'Clinic email', required: false })
  @Column({ type: 'varchar', nullable: true })
  email: string;

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments: Appointment[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
