import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

class NotificationEventsDto {
  @ApiProperty({ description: 'Notify on new appointment booking' })
  @IsBoolean()
  newAppointmentBooking: boolean;

  @ApiProperty({ description: 'Notify on appointment reminder' })
  @IsBoolean()
  appointmentReminder: boolean;

  @ApiProperty({ description: 'Notify on appointment cancellation' })
  @IsBoolean()
  appointmentCancellation: boolean;

  @ApiProperty({ description: 'Notify on new patient message' })
  @IsBoolean()
  newPatientMessage: boolean;
}

class DeliveryMethodsDto {
  @ApiProperty({ description: 'Receive notifications via email' })
  @IsBoolean()
  email: boolean;

  @ApiProperty({ description: 'Receive notifications via SMS' })
  @IsBoolean()
  sms: boolean;

  @ApiProperty({ description: 'Receive notifications in-app' })
  @IsBoolean()
  inApp: boolean;
}

class QuietHoursDto {
  @ApiProperty({ description: 'Enable quiet hours' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Quiet hours start time', example: '22:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Quiet hours end time', example: '08:00' })
  @IsString()
  endTime: string;
}

export class NotificationSettingsDto {
  @ApiProperty({ type: () => NotificationEventsDto })
  @ValidateNested()
  @Type(() => NotificationEventsDto)
  events: NotificationEventsDto;

  @ApiProperty({ type: () => DeliveryMethodsDto })
  @ValidateNested()
  @Type(() => DeliveryMethodsDto)
  deliveryMethods: DeliveryMethodsDto;

  @ApiProperty({ type: () => QuietHoursDto })
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours: QuietHoursDto;
}
