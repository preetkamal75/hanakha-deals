import React, { useState } from 'react';
import { Copy, Share2, QrCode, Link as LinkIcon, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ReferralLinkGenerator: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [linkType, setLinkType] = useState<'customer' | 'company'>('customer');

  const baseUrl = window.location.origin;
  const referralCode = user?.sponsorshipNumber || 'SP00000000';
  
  const referralLinks = {
    customer: `${baseUrl}/customer/register?ref=${referralCode}`,
    company: `${baseUrl}/company/register?ref=${referralCode}`
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareLink = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join My MLM Network',
          text: 'Join my network and start earning!',
          url: text
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      copyToClipboard(text);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <Share2 className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Referral Links</h3>
          <p className="text-gray-600">Share your referral links to grow your network</p>
        </div>
      </div>

      {/* Your Referral Code */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Referral Code</h4>
          <div className="text-2xl font-bold text-indigo-600 font-mono tracking-wider">
            {referralCode}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this code with potential referrals
          </p>
        </div>
      </div>

      {/* Link Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Registration Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLinkType('customer')}
            className={`p-4 rounded-lg border-2 transition-all ${
              linkType === 'customer'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-semibold">Customer</div>
              <div className="text-sm text-gray-600">Individual users</div>
            </div>
          </button>
          <button
            onClick={() => setLinkType('company')}
            className={`p-4 rounded-lg border-2 transition-all ${
              linkType === 'company'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-semibold">Company</div>
              <div className="text-sm text-gray-600">Business entities</div>
            </div>
          </button>
        </div>
      </div>

      {/* Generated Link */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {linkType === 'customer' ? 'Customer' : 'Company'} Registration Link
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={referralLinks[linkType]}
                readOnly
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
            </div>
            <button
              onClick={() => copyToClipboard(referralLinks[linkType])}
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={() => shareLink(referralLinks[linkType])}
              className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How Binary Tree Placement Works</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>When someone joins using your referral link:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>System finds the first available position in your network</li>
            <li>Follows top-to-bottom, left-to-right placement algorithm</li>
            <li>Places new user in the optimal position for balanced growth</li>
            <li>You earn commissions from their activity and network growth</li>
          </ol>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="mt-6 text-center">
        <button className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <QrCode className="h-4 w-4" />
          <span>Generate QR Code</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Generate QR code for easy mobile sharing
        </p>
      </div>
    </div>
  );
};

export default ReferralLinkGenerator;