export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ShipmentData {
  id: string
  orderNumber: string
  shipFrom: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  shipTo: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  package: {
    weight: number
    length: number
    width: number
    height: number
    description: string
  }
  status: string
  service: string
  price: number
  createdAt: string
}

export interface AddressData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export interface PackageData {
  id: string
  name: string
  weight: number
  length: number
  width: number
  height: number
  description: string
}

class ApiClient {
  private baseUrl = "/api"

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Shipments endpoints
  async createShipment(data: Partial<ShipmentData>): Promise<ShipmentData> {
    return this.request("/shipments/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async listShipments(status?: string, page = 1): Promise<{ results: ShipmentData[]; count: number }> {
    const params = new URLSearchParams({ page: page.toString() })
    if (status) params.append("status", status)
    return this.request(`/shipments/list?${params.toString()}`)
  }

  async getShipment(id: string): Promise<ShipmentData> {
    return this.request(`/shipments/${id}`)
  }

  async updateShipment(id: string, data: Partial<ShipmentData>): Promise<ShipmentData> {
    return this.request(`/shipments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteShipment(id: string): Promise<{ success: boolean }> {
    return this.request(`/shipments/${id}`, {
      method: "DELETE",
    })
  }

  // Bulk upload endpoint
  async uploadBulkShipments(file: File): Promise<{ records: ShipmentData[]; errors: string[] }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseUrl}/bulk-upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Addresses endpoints
  async listAddresses(): Promise<AddressData[]> {
    return this.request("/addresses/list")
  }

  async createAddress(data: Partial<AddressData>): Promise<AddressData> {
    return this.request("/addresses/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Packages endpoints
  async listPackages(): Promise<PackageData[]> {
    return this.request("/packages/list")
  }

  async createPackage(data: Partial<PackageData>): Promise<PackageData> {
    return this.request("/packages/create", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Labels endpoint
  async generateLabels(shipmentIds: string[], labelSize: string): Promise<{ labels: string[]; url: string }> {
    return this.request("/labels/generate", {
      method: "POST",
      body: JSON.stringify({ shipment_ids: shipmentIds, label_size: labelSize }),
    })
  }
}

export const apiClient = new ApiClient()
