'use client'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category?: string
  variables?: string[]
  isLocal?: boolean
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Email',
    category: 'General',
    subject: '',
    body: '<p></p>',
    variables: [],
    isLocal: true,
  },
  {
    id: 'welcome_buyer',
    name: 'Welcome - New Buyer',
    category: 'Buyer',
    subject: 'Welcome to Your Home Search Journey!',
    body: `<p>Hi {{client_name}},</p>
<p>Welcome! I'm thrilled to help you find your perfect home. This is an exciting journey, and I'm here to make it as smooth and enjoyable as possible.</p>
<p><strong>What happens next?</strong></p>
<ul>
  <li>I'll set up your property search based on your criteria.</li>
  <li>You'll receive new listings as soon as they hit the market.</li>
  <li>We'll schedule showings for properties that interest you.</li>
  <li>I'll guide you through every step of the buying process.</li>
</ul>
<p><strong>Your search criteria:</strong></p>
<ul>
  <li>Location: {{location}}</li>
  <li>Price Range: {{price_range}}</li>
  <li>Bedrooms: {{bedrooms}}</li>
  <li>Property Type: {{property_type}}</li>
</ul>
<p>Feel free to reach out anytime with questions. I'm here to help!</p>
<p>Best regards,<br/>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'location', 'price_range', 'bedrooms', 'property_type', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'welcome_seller',
    name: 'Welcome - New Seller',
    category: 'Seller',
    subject: "Let's Get Your Property Sold!",
    body: `<p>Hi {{client_name}},</p>
<p>Thank you for choosing me to sell your property at <strong>{{property_address}}</strong>. I'm committed to getting you the best possible price in the shortest time frame.</p>
<p><strong>Our plan:</strong></p>
<ul>
  <li>Prepare market analysis for optimal listing price.</li>
  <li>Walkthrough scheduled on {{walkthrough_date}}.</li>
  <li>Professional photos on {{photo_date}}.</li>
  <li>Target listing date: {{listing_date}}.</li>
</ul>
<p>I'll keep you updated every step of the way. Let's get your property sold!</p>
<p>Best regards,<br/>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'property_address', 'walkthrough_date', 'photo_date', 'listing_date', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'showing_confirmation',
    name: 'Showing Confirmation',
    category: 'Showing',
    subject: 'Property Showing Confirmed',
    body: `<p>Hi {{client_name}},</p>
<p>Your property showing has been confirmed for:</p>
<p><strong>{{property_address}}</strong><br/>{{showing_date}} at {{showing_time}} ({{duration}} minutes)</p>
<p>Meeting instructions: {{meeting_instructions}}</p>
<p>Looking forward to it!</p>
<p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'showing_date', 'showing_time', 'duration', 'meeting_instructions', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
  {
    id: 'offer_received',
    name: 'Offer Received',
    category: 'Offers',
    subject: 'Offer Received on Your Property',
    body: `<p>Hi {{client_name}},</p>
<p>Great news! We've received an offer on <strong>{{property_address}}</strong>.</p>
<p><strong>Offer details:</strong></p>
<ul>
  <li>Offer Price: {{offer_price}}</li>
  <li>Earnest Money: {{earnest_money}}</li>
  <li>Financing: {{financing_type}}</li>
  <li>Closing Date: {{closing_date}}</li>
  <li>Contingencies: {{contingencies}}</li>
</ul>
<p>My recommendation: {{recommendation}}</p>
<p>Let's review together.</p>
<p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'offer_price', 'earnest_money', 'financing_type', 'closing_date', 'contingencies', 'recommendation', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
  {
    id: 'offer_accepted',
    name: 'Offer Accepted',
    category: 'Offers',
    subject: 'Congratulations - Offer Accepted!',
    body: `<p>Hi {{client_name}},</p>
<p>Fantastic news! Your offer on {{property_address}} has been accepted.</p>
<p><strong>Key dates:</strong></p>
<ul>
  <li>Purchase Price: {{purchase_price}}</li>
  <li>Closing Date: {{closing_date}}</li>
  <li>Inspection Period: {{inspection_period}}</li>
</ul>
<p>Next steps include inspection, appraisal, loan approval, and closing day.</p>
<p>I'll keep everything on track. Congratulations!</p>
<p>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'property_address', 'purchase_price', 'closing_date', 'inspection_period', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'closing_reminder',
    name: 'Closing Reminder',
    category: 'Closing',
    subject: 'Your Closing is Coming Up!',
    body: `<p>Hi {{client_name}},</p>
<p>Your closing for {{property_address}} is scheduled for <strong>{{closing_date}}</strong> at {{closing_time}}.</p>
<p><strong>Location:</strong> {{closing_location}}</p>
<p>Please bring:</p>
<ul>
  <li>Government-issued photo ID</li>
  <li>Cashier's check or wiring confirmation ({{closing_costs}})</li>
  <li>Proof of homeowner's insurance</li>
  <li>Any lender-required documents</li>
</ul>
<p>See you at closing!</p>
<p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'closing_date', 'closing_time', 'closing_location', 'closing_costs', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
]


