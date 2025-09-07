import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, User, RoleType, Clinic } from '../../entities';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async seed() {
    // Create roles
    await this.seedRoles();
    
    // Create default admin user
    await this.seedAdminUser();
    
    // Create sample clinics
    await this.seedClinics();
    
    console.log('Database seeded successfully!');
  }

  private async seedRoles() {
    const roles = [
      { name: RoleType.ADMIN, description: 'System administrator with full access' },
      { name: RoleType.DOCTOR, description: 'Medical doctor who provides consultation' },
      { name: RoleType.ASSISTANT, description: 'Doctor assistant who helps with appointments' },
      { name: RoleType.USER, description: 'Regular user/patient' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({ 
        where: { name: roleData.name } 
      });
      
      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        console.log(`Created role: ${roleData.name}`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@hospital.com';
    const existingAdmin = await this.userRepository.findOne({ 
      where: { email: adminEmail } 
    });

    if (!existingAdmin) {
      const adminRole = await this.roleRepository.findOne({ 
        where: { name: RoleType.ADMIN } 
      });

      if (adminRole) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = this.userRepository.create({
          email: adminEmail,
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1234567890',
          roleId: adminRole.id,
          isActive: true,
          isEmailVerified: true,
        });

        await this.userRepository.save(admin);
        console.log('Created admin user: admin@hospital.com / admin123');
      }
    }
  }

  private async seedClinics() {
    const clinics = [
      {
        locationName: 'Main Hospital',
        address: '123 Medical Center Drive',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        phone: '+1-555-0100',
        email: 'main@hospital.com',
      },
      {
        locationName: 'Downtown Clinic',
        address: '456 Health Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        phone: '+1-555-0200',
        email: 'downtown@hospital.com',
      },
      {
        locationName: 'Westside Medical Center',
        address: '789 Care Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        phone: '+1-555-0300',
        email: 'westside@hospital.com',
      },
    ];

    for (const clinicData of clinics) {
      const existingClinic = await this.clinicRepository.findOne({
        where: { locationName: clinicData.locationName },
      });

      if (!existingClinic) {
        const clinic = this.clinicRepository.create(clinicData);
        await this.clinicRepository.save(clinic);
        console.log(`Created clinic: ${clinicData.locationName}`);
      }
    }
  }
}



