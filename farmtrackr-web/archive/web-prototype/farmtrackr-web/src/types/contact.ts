export interface FarmContact {
  id: string
  firstName: string
  lastName: string
  farm?: string
  mailingAddress?: string
  city?: string
  state?: string
  zipCode?: number
  email1?: string
  email2?: string
  phoneNumber1?: string
  phoneNumber2?: string
  phoneNumber3?: string
  phoneNumber4?: string
  phoneNumber5?: string
  phoneNumber6?: string
  siteMailingAddress?: string
  siteCity?: string
  siteState?: string
  siteZipCode?: number
  notes?: string
  dateCreated: Date
  dateModified: Date
}

export interface ContactFormData {
  firstName: string
  lastName: string
  farm?: string
  mailingAddress?: string
  city?: string
  state?: string
  zipCode?: number
  email1?: string
  email2?: string
  phoneNumber1?: string
  phoneNumber2?: string
  phoneNumber3?: string
  phoneNumber4?: string
  phoneNumber5?: string
  phoneNumber6?: string
  siteMailingAddress?: string
  siteCity?: string
  siteState?: string
  siteZipCode?: number
  notes?: string
}