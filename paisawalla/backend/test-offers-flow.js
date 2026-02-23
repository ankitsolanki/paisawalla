/**
 * Test script to verify the offers flow
 * Run with: node test-offers-flow.js
 */

import mongoose from 'mongoose';
import { Lead } from './src/models/Lead.js';
import { Application } from './src/models/Application.js';
import { BreSession } from './src/models/BreSession.js';
import { Offer } from './src/models/Offer.js';
import { breService } from './src/services/breService.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karix';

async function testOffersFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test lead with phone ending in 0 (even)
    const lead = new Lead({
      formType: 'form3',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '9987014300', // Ends in 0 (even)
      loanAmount: 500000,
      zipCode: '400066',
      status: 'new',
    });
    await lead.save();
    console.log('✅ Lead created:', lead._id);

    // Create application from lead
    const count = await Application.countDocuments();
    const applicationNumber = `APP-${Date.now()}-${count + 1}`;
    
    const application = new Application({
      leadId: lead._id,
      applicationNumber,
      applicationData: lead.toObject(),
      status: 'pending',
    });
    await application.save();
    console.log('✅ Application created:', application._id);

    // Populate leadId for BRE service
    await application.populate('leadId');

    // Initiate BRE
    console.log('🔄 Initiating BRE...');
    const breRequest = await breService.initiateRequest(application);
    console.log('✅ BRE initiated:', breRequest.requestId);

    // Create BRE session
    const breSession = new BreSession({
      applicationId: application._id,
      breRequestId: breRequest.requestId,
      status: 'initiated',
      requestPayload: breRequest.payload,
    });
    await breSession.save();

    // Update application
    application.status = 'bre_processing';
    application.breRequestId = breRequest.requestId;
    application.breStatus = 'initiated';
    await application.save();

    // Poll BRE status until complete
    console.log('🔄 Polling BRE status...');
    let attempts = 0;
    let breStatus = null;
    
    while (attempts < 10) {
      breStatus = await breService.checkStatus(breRequest.requestId);
      console.log(`  Attempt ${attempts + 1}: Status = ${breStatus.status}`);
      
      if (breStatus.status === 'completed') {
        console.log('✅ BRE completed!');
        console.log('  Offers:', breStatus.response?.offers?.length || 0);
        break;
      } else if (breStatus.status === 'failed') {
        console.log('❌ BRE failed:', breStatus.error);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (breStatus?.status === 'completed' && breStatus.response?.offers) {
      // Create offers
      console.log('🔄 Creating offers...');
      for (const breOffer of breStatus.response.offers) {
        const offer = new Offer({
          applicationId: application._id,
          lenderId: breOffer.id || `LENDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          lenderName: breOffer.lender || 'Lender',
          loanAmount: breOffer.amount || 0,
          interestRate: breOffer.apr || 0,
          termMonths: breOffer.term || 36,
          monthlyPayment: breOffer.monthlyPayment || 0,
          apr: breOffer.apr || 0,
          offerType: 'standard',
          status: 'available',
          offerData: breOffer,
        });
        await offer.save();
      }
      console.log('✅ Offers created');
    }

    // Check offers
    const offers = await Offer.find({ applicationId: application._id });
    console.log(`\n📊 Final Results:`);
    console.log(`  Application ID: ${application._id}`);
    console.log(`  BRE Request ID: ${breRequest.requestId}`);
    console.log(`  BRE Status: ${breStatus?.status}`);
    console.log(`  Offers Count: ${offers.length}`);
    
    if (offers.length > 0) {
      console.log('\n✅ SUCCESS: Offers were created!');
      offers.forEach((offer, index) => {
        console.log(`  Offer ${index + 1}: ${offer.lenderName} - $${offer.loanAmount} @ ${offer.apr}% APR`);
      });
    } else {
      console.log('\n❌ FAILURE: No offers were created!');
      console.log('  BRE Response:', JSON.stringify(breStatus?.response, null, 2));
    }

    // Cleanup (optional - comment out to keep test data)
    // await Lead.deleteOne({ _id: lead._id });
    // await Application.deleteOne({ _id: application._id });
    // await BreSession.deleteOne({ _id: breSession._id });
    // await Offer.deleteMany({ applicationId: application._id });
    // console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testOffersFlow();

