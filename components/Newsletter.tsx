import React, { useState } from 'react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the form submission to your backend
    setIsSubmitted(true);
    setEmail('');
    setName('');
    
    // Reset the success message after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-blue-100 mb-8">
            Subscribe to our newsletter for spiritual insights, product updates, and exclusive offers.
          </p>
          
          {isSubmitted ? (
            <div className="bg-green-500 text-white p-4 rounded-md mb-8">
              Thank you for subscribing! You&apos;ll receive our next newsletter soon.

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:flex md:gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Subscribe Now
              </button>
            </form>
          )}
          
          <p className="text-blue-100 text-sm mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;