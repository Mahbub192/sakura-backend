import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Clinic, Role, RoleType, User } from '../../entities';

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

    // Create default users (admin, doctor, user)
    await this.seedUsers();

    // Create sample clinics
    await this.seedClinics();

    console.log('Database seeded successfully!');
  }

  private async seedRoles() {
    const roles = [
      {
        name: RoleType.ADMIN,
        description: 'System administrator with full access',
      },
      {
        name: RoleType.DOCTOR,
        description: 'Medical doctor who provides consultation',
      },
      {
        name: RoleType.ASSISTANT,
        description: 'Doctor assistant who helps with appointments',
      },
      { name: RoleType.USER, description: 'Regular user/patient' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        console.log(`Created role: ${roleData.name}`);
      }
    }
  }

  private async seedUsers() {
    // Seed Admin User
    await this.seedAdminUser();

    // Seed Doctor User
    await this.seedDoctorUser();

    // Seed Regular User/Patient
    await this.seedRegularUser();
  }

  private async seedAdminUser() {
    const adminPhone = '01700000001';
    const adminEmail = 'admin@hospital.com';
    const existingAdmin = await this.userRepository.findOne({
      where: { phone: adminPhone },
    });

    if (!existingAdmin) {
      const adminRole = await this.roleRepository.findOne({
        where: { name: RoleType.ADMIN },
      });

      if (adminRole) {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = this.userRepository.create({
          phone: adminPhone,
          email: adminEmail,
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          roleId: adminRole.id,
          isActive: true,
          isEmailVerified: true,
        });

        await this.userRepository.save(admin);
        console.log(
          `✅ Created Admin User - Phone: ${adminPhone}, Password: admin123`,
        );
      }
    } else {
      console.log(`ℹ️  Admin user already exists with phone: ${adminPhone}`);
    }
  }

  private async seedDoctorUser() {
    const doctorPhone = '01700000002';
    const doctorEmail = 'doctor@hospital.com';
    const existingDoctor = await this.userRepository.findOne({
      where: { phone: doctorPhone },
    });

    if (!existingDoctor) {
      const doctorRole = await this.roleRepository.findOne({
        where: { name: RoleType.DOCTOR },
      });

      if (doctorRole) {
        const hashedPassword = await bcrypt.hash('doctor123', 10);

        const doctor = this.userRepository.create({
          phone: doctorPhone,
          email: doctorEmail,
          password: hashedPassword,
          firstName: 'Dr. John',
          lastName: 'Smith',
          roleId: doctorRole.id,
          isActive: true,
          isEmailVerified: true,
        });

        await this.userRepository.save(doctor);
        console.log(
          `✅ Created Doctor User - Phone: ${doctorPhone}, Password: doctor123`,
        );
      }
    } else {
      console.log(`ℹ️  Doctor user already exists with phone: ${doctorPhone}`);
    }
  }

  private async seedRegularUser() {
    const userPhone = '01700000003';
    const userEmail = 'user@hospital.com';
    const existingUser = await this.userRepository.findOne({
      where: { phone: userPhone },
    });

    if (!existingUser) {
      const userRole = await this.roleRepository.findOne({
        where: { name: RoleType.USER },
      });

      if (userRole) {
        const hashedPassword = await bcrypt.hash('user123', 10);

        const user = this.userRepository.create({
          phone: userPhone,
          email: userEmail,
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Doe',
          roleId: userRole.id,
          isActive: true,
          isEmailVerified: true,
        });

        await this.userRepository.save(user);
        console.log(
          `✅ Created Regular User - Phone: ${userPhone}, Password: user123`,
        );
      }
    } else {
      console.log(`ℹ️  Regular user already exists with phone: ${userPhone}`);
    }
  }

  private async seedClinics() {
    const clinics = [
      {
        locationName: 'ডা. আব্দুল গণি হেল্থ কমপ্লেক্স',
        address: 'মালিবাগ মোড়',
        city: 'বকশীগঞ্জ, জামালপুর',
        state: 'জামালপুর',
        postalCode: '2040',
        phone: '+880-1700-000001',
        email: 'abdulgani@hospital.com',
      },
      {
        locationName: 'উত্তরা স্পেশালাইজড হাসপাতাল',
        address: 'বৈশাখ প্লাজা, সজবরখিলা',
        city: 'শেরপুর',
        state: 'শেরপুর',
        postalCode: '2100',
        phone: '+880-1700-000002',
        email: 'uttara@hospital.com',
      },
      {
        locationName: 'ব্র্যাক হেল্থকেয়ার (সিদ্ধেশ্বরী)',
        address:
          '১১৬/১, সিদ্ধেশ্বরী সাবুলার রোড, ২৭ শহীন সাংবাদিক সেলিনা পারজান গৌড়',
        city: 'ঢাকা',
        state: 'ঢাকা',
        postalCode: '1217',
        phone: '+880-1700-000003',
        email: 'brac@hospital.com',
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
