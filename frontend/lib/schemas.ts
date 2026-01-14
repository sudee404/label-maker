import { z } from "zod";

export const addressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP code required"),
  state: z.string().min(2, "State is required"),
  phone: z.string().regex(/^[0-9\-+$$$$\s]*$/, "Valid phone number required"),
});

export const packageSchema = z.object({
  length_inches: z.number().min(0.1, "Length must be greater than 0"),
  width_inches: z.number().min(0.1, "Width must be greater than 0"),
  height_inches: z.number().min(0.1, "Height must be greater than 0"),
  weight_lbs: z.number().min(0, "Weight in lbs cannot be negative"),
  weight_oz: z.number().min(0).max(15.99, "Ounces must be between 0 and 15.99"),
  sku: z.string().optional().default(""),
});

export const shipmentRecordSchema = z.object({
  id: z.string(),
  batch: z.string(),
  order_no: z.string().min(1, "Order number is required"),
  ship_from: addressSchema,
  ship_to: addressSchema,
  package: packageSchema,
  shipping_service: z.string().optional(),
  price: z.number().optional(),
  status: z.string(),
  error_message: z.string(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type ShipmentRecord = z.infer<typeof shipmentRecordSchema>;
