import { PartialType } from '@nestjs/swagger';
import { CreateTokenAppointmentDto } from './create-token-appointment.dto';

export class UpdateTokenAppointmentDto extends PartialType(CreateTokenAppointmentDto) {}
