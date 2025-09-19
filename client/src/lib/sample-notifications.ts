import { apiRequest } from './queryClient';

interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead?: boolean;
  metadata?: any;
  entityId?: string;
  entityType?: string;
}

// Sample notifications for different user roles
export const sampleNotifications = {
  buyer: [
    {
      type: 'quote_received',
      title: 'New Quote Received',
      message: 'You have received a new quote for RFQ-2025-001 from MetalWorks Industries. Quote amount: ₹45,000',
      metadata: { rfqId: 'rfq-001', amount: 45000, supplierId: 'supplier-001' },
      entityType: 'rfq',
      isRead: false
    },
    {
      type: 'rfq_approved',
      title: 'RFQ Approved',
      message: 'Your RFQ for CNC Machining Components has been approved and is now live for supplier bidding.',
      metadata: { rfqId: 'rfq-002' },
      entityType: 'rfq',
      isRead: false
    },
    {
      type: 'order_status_change',
      title: 'Order in Production',
      message: 'Your order #ORD-2025-001 has moved to production stage. Estimated delivery: Jan 15, 2025',
      metadata: { orderId: 'ord-001', status: 'production', estimatedDelivery: '2025-01-15' },
      entityType: 'order',
      isRead: true
    },
    {
      type: 'inspection_completed',
      title: 'Quality Inspection Passed',
      message: 'Quality inspection for order #ORD-2025-001 has been completed successfully. Ready for shipment.',
      metadata: { orderId: 'ord-001', inspectionResult: 'pass' },
      entityType: 'order',
      isRead: false
    },
    {
      type: 'quote_accepted',
      title: 'Quote Accepted',
      message: 'Congratulations! Your selected quote from TechFab Solutions has been processed. Order created.',
      metadata: { quoteId: 'quote-001', orderId: 'ord-002' },
      entityType: 'quote',
      isRead: true
    }
  ],
  supplier: [
    {
      type: 'supplier_invitation',
      title: 'New RFQ Invitation',
      message: 'You have been invited to bid on RFQ for Sheet Metal Fabrication. Deadline: Dec 30, 2024',
      metadata: { rfqId: 'rfq-003', deadline: '2024-12-30' },
      entityType: 'rfq',
      isRead: false
    },
    {
      type: 'supplier_verified',
      title: 'Profile Verification Updated',
      message: 'Your supplier profile has been upgraded to Silver verification status. You can now bid on premium RFQs.',
      metadata: { verificationLevel: 'silver', previousLevel: 'bronze' },
      entityType: 'supplier_profile',
      isRead: false
    },
    {
      type: 'quote_accepted',
      title: 'Quote Accepted!',
      message: 'Great news! Your quote for ₹32,000 has been accepted by TechStart Solutions. Order details will follow.',
      metadata: { quoteId: 'quote-002', amount: 32000, buyerId: 'buyer-001' },
      entityType: 'quote',
      isRead: false
    },
    {
      type: 'payout_processed',
      title: 'Payment Received',
      message: 'Payment of ₹28,800 (after fees) has been processed to your account for order #ORD-2025-003.',
      metadata: { orderId: 'ord-003', amount: 28800, originalAmount: 32000 },
      entityType: 'payout',
      isRead: true
    },
    {
      type: 'order_created',
      title: 'New Order Assigned',
      message: 'Order #ORD-2025-004 has been created from your accepted quote. Production can begin.',
      metadata: { orderId: 'ord-004', rfqId: 'rfq-004' },
      entityType: 'order',
      isRead: false
    }
  ],
  admin: [
    {
      type: 'rfq_submitted',
      title: 'New RFQ Submitted',
      message: 'AutoParts Manufacturing has submitted a new RFQ for Injection Molding Components worth ₹2.5L',
      metadata: { rfqId: 'rfq-005', buyerId: 'buyer-002', estimatedValue: 250000 },
      entityType: 'rfq',
      isRead: false
    },
    {
      type: 'supplier_verification',
      title: 'Supplier Awaiting Verification',
      message: 'PrecisionTech Industries has submitted documents for Gold verification. Review required.',
      metadata: { supplierId: 'supplier-003', requestedLevel: 'gold' },
      entityType: 'supplier_profile',
      isRead: false
    },
    {
      type: 'order_status_change',
      title: 'Order Requires Attention',
      message: 'Order #ORD-2025-002 inspection failed. Buyer and supplier have been notified for resolution.',
      metadata: { orderId: 'ord-002', status: 'inspection_failed', issueType: 'quality' },
      entityType: 'order',
      isRead: false
    },
    {
      type: 'general',
      title: 'Monthly Report Available',
      message: 'December 2024 platform metrics report is ready. 127 RFQs processed, 89% success rate.',
      metadata: { period: '2024-12', totalRfqs: 127, successRate: 89 },
      entityType: 'report',
      isRead: true
    },
    {
      type: 'general',
      title: 'System Maintenance Scheduled',
      message: 'Planned maintenance window: Jan 1, 2025, 2:00-4:00 AM IST. Platform will be temporarily unavailable.',
      metadata: { maintenanceDate: '2025-01-01', startTime: '02:00', endTime: '04:00' },
      entityType: 'system',
      isRead: false
    }
  ]
};

export async function createSampleNotifications(userId: string, userRole: string) {
  const notifications = sampleNotifications[userRole as keyof typeof sampleNotifications] || [];
  
  const results = [];
  for (const notification of notifications) {
    try {
      const payload: CreateNotificationPayload = {
        ...notification,
        userId
      };
      
      const result = await apiRequest('POST', '/api/protected/notifications', payload);
      
      results.push(result);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }
  
  return results;
}

// Utility function to create notifications for current user
export async function generateNotificationsForCurrentUser() {
  try {
    // This would typically get user info from auth context
    // For now, we'll create a few sample notifications
    const testNotifications = [
      {
        userId: 'current-user', // This should be replaced with actual user ID
        type: 'general',
        title: 'Welcome to Logicwerk!',
        message: 'Your account has been successfully created. Start exploring our B2B marketplace for manufacturing services.',
        isRead: false,
        metadata: { welcomeNotification: true }
      },
      {
        userId: 'current-user',
        type: 'general',
        title: 'Profile Completion',
        message: 'Complete your profile to get better matches and unlock premium features.',
        isRead: false,
        metadata: { profileCompletion: 45 }
      }
    ];
    
    for (const notification of testNotifications) {
      await apiRequest('POST', '/api/protected/notifications', notification);
    }
    
    console.log('Sample notifications created successfully!');
  } catch (error) {
    console.error('Failed to create sample notifications:', error);
  }
}