'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

// Common features for all plans
const commonFeatures = [
  'Create AI Characters',
  'Character Gallery Access',
  'Character Customization',
  'Community Access'
]

// Pricing tiers
const pricingTiers = [
  {
    name: 'Free',
    description: 'Perfect for trying out the platform.',
    price: {
      monthly: 0,
      annually: 0,
    },
    features: [
      ...commonFeatures,
      { text: '3 Active Characters', included: true },
      { text: 'Basic Voice Chats', included: true },
      { text: 'Video Calls', included: false },
      { text: 'Character Memory', included: false },
      { text: 'Priority Support', included: false },
      { text: 'Advanced Character Logic', included: false },
    ],
    callToAction: 'Get Started',
    callToActionLink: '/signup',
    popular: false,
    color: 'gray',
  },
  {
    name: 'Basic',
    description: 'Ideal for personal use and casual conversations.',
    price: {
      monthly: 9.99,
      annually: 99.99,
    },
    features: [
      ...commonFeatures,
      { text: '10 Active Characters', included: true },
      { text: 'Enhanced Voice Chats', included: true },
      { text: '15-minute Video Calls', included: true },
      { text: 'Basic Character Memory', included: true },
      { text: 'Priority Support', included: false },
      { text: 'Advanced Character Logic', included: false },
    ],
    callToAction: 'Start Basic',
    callToActionLink: '/signup?plan=basic',
    popular: false,
    color: 'blue',
  },
  {
    name: 'Premium',
    description: 'For enthusiasts wanting deeper connections.',
    price: {
      monthly: 19.99,
      annually: 199.99,
    },
    features: [
      ...commonFeatures,
      { text: '25 Active Characters', included: true },
      { text: 'Advanced Voice Chats', included: true },
      { text: 'Unlimited Video Calls', included: true },
      { text: 'Enhanced Character Memory', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Advanced Character Logic', included: false },
    ],
    callToAction: 'Get Premium',
    callToActionLink: '/signup?plan=premium',
    popular: true,
    color: 'indigo',
  },
  {
    name: 'Ultimate',
    description: 'The complete experience for power users.',
    price: {
      monthly: 34.99,
      annually: 349.99,
    },
    features: [
      ...commonFeatures,
      { text: 'Unlimited Characters', included: true },
      { text: 'Professional Voice Chats', included: true },
      { text: 'HD Video Calls', included: true },
      { text: 'Advanced Character Memory', included: true },
      { text: '24/7 Priority Support', included: true },
      { text: 'Advanced Character Logic', included: true },
    ],
    callToAction: 'Get Ultimate',
    callToActionLink: '/signup?plan=ultimate',
    popular: false,
    color: 'purple',
  },
]

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly')
  
  const getDiscountPercentage = (monthly: number, annually: number) => {
    if (monthly === 0 || annually === 0) return 0
    return Math.round(100 - (annually / (monthly * 12)) * 100)
  }
  
  return (
    <>
      <div className="min-h-screen py-20 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-900/40 to-black/80" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-950/50 border border-indigo-800/50 mb-8 backdrop-blur-sm"
            >
              <span className="text-sm text-indigo-300">Simple, transparent pricing</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Perfect</span> Plan
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 text-lg leading-8 text-gray-300 max-w-xl mx-auto"
            >
              Unlock the full potential of your AI companions with our flexible subscription options.
              Cancel anytime. No hidden fees.
            </motion.p>
            
            {/* Billing toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-12 flex justify-center"
            >
              <div className="relative flex rounded-full p-1.5 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50">
                <button
                  type="button"
                  className={`relative rounded-full py-2 px-6 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-all duration-300 ${
                    billingInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`relative ml-0.5 rounded-full py-2 px-6 text-sm font-medium whitespace-nowrap focus:outline-none focus:z-10 transition-all duration-300 ${
                    billingInterval === 'annually'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setBillingInterval('annually')}
                >
                  Annually
                  <span className="absolute -top-3 -right-3 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold">
                    Save 16%+
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Pricing cards */}
          <div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-4">
            {pricingTiers.map((tier, index) => {
              const discount = getDiscountPercentage(tier.price.monthly, tier.price.annually)
              
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className={`relative flex flex-col rounded-3xl ${
                    tier.popular
                      ? 'ring-2 ring-indigo-500 bg-black/40'
                      : 'ring-1 ring-white/10 bg-black/30'
                  } backdrop-blur-md p-8 shadow-lg`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                    <p className="mt-2 text-gray-400">{tier.description}</p>
                  </div>
                  
                  <div className="mb-8">
                    <p className="flex items-baseline">
                      <span className="text-5xl font-bold tracking-tight text-white">
                        ${billingInterval === 'monthly' ? tier.price.monthly : tier.price.annually}
                      </span>
                      <span className="ml-2 text-gray-400">
                        /{billingInterval === 'monthly' ? 'month' : 'year'}
                      </span>
                    </p>
                    
                    {billingInterval === 'annually' && tier.price.monthly > 0 && (
                      <p className="mt-1 text-sm text-green-500">
                        Save {discount}% compared to monthly
                      </p>
                    )}
                  </div>
                  
                  <ul className="mb-8 space-y-4 flex-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <div className="flex-shrink-0">
                          {typeof feature === 'string' ? (
                            <Check className="h-5 w-5 text-indigo-400" />
                          ) : feature.included ? (
                            <Check className="h-5 w-5 text-indigo-400" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <span className="ml-3 text-gray-300">
                          {typeof feature === 'string' ? feature : feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={tier.callToActionLink}
                    className={`relative group overflow-hidden rounded-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                        : 'bg-white/10 hover:bg-white/20'
                    } px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-300 text-center`}
                  >
                    {tier.callToAction}
                    {tier.popular && (
                      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>
          
          {/* FAQ Section */}
          <div className="mt-32 mx-auto max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl font-bold tracking-tight text-white text-center mb-12"
            >
              Frequently Asked Questions
            </motion.h2>
            
            <div className="space-y-8">
              {[
                {
                  question: 'Can I switch between plans?',
                  answer: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the end of your current billing cycle.',
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through our payment processor.',
                },
                {
                  question: 'Is there a free trial?',
                  answer: 'We offer a 7-day free trial for our Premium plan. You can experience all Premium features before deciding if it\'s right for you.',
                },
                {
                  question: 'What happens to my characters if I downgrade?',
                  answer: 'If you downgrade to a plan that supports fewer characters, your excess characters will be archived until you upgrade again.',
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-300">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Call to action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-32 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300 max-w-xl mx-auto">
              Join thousands of users creating meaningful connections with AI characters.
              Start for free, no credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="relative group overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300"
              >
                <span className="relative z-10">Get Started Free</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
} 