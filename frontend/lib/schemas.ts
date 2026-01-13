import { z } from "zod"

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  address2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP code required"),
  state: z.string().min(2, "State is required"),
  phone: z.string().regex(/^[0-9\-+$$$$\s]*$/, "Valid phone number required"),
})

export const packageSchema = z.object({
  length: z.number().min(0.1, "Length must be greater than 0"),
  width: z.number().min(0.1, "Width must be greater than 0"),
  height: z.number().min(0.1, "Height must be greater than 0"),
  lbs: z.number().min(0, "Weight in lbs cannot be negative"),
  oz: z.number().min(0).max(15.99, "Ounces must be between 0 and 15.99"),
  sku: z.string().optional().default(""),
})

export const shipmentRecordSchema = z.object({
  id: z.string(),
  batch: z.string(),
  orderNo: z.string().min(1, "Order number is required"),
  shipFrom: addressSchema,
  shipTo: addressSchema,
  package: packageSchema,
  shippingService: z.string().optional(),
  shippingPrice: z.number().optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
export type PackageFormData = z.infer<typeof packageSchema>
export type ShipmentRecord = z.infer<typeof shipmentRecordSchema>
