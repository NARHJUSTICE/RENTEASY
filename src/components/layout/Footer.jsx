import React from 'react';
import { Home, Mail, Phone, Github, Linkedin, Twitter, Instagram, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // ✅ Your updated social links
  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/NARHJUSTICE',
      color: 'hover:text-gray-900'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: 'https://wa.me/919815494702',
      color: 'hover:text-green-500'
    },
    {
      name: 'Gmail',
      icon: Mail,
      url: 'mailto:justicenarh9@gmail.com',
      color: 'hover:text-red-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://www.linkedin.com/in/justice-narh-535646294/',
      color: 'hover:text-blue-700'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/yourusername',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/yourusername',
      color: 'hover:text-pink-600'
    }
  ];

  // ✅ Updated quick links with legal pages
  const quickLinks = [
    { name: 'Browse Properties', path: '/browse' },
    { name: 'My Applications', path: '/my-applications' },
    { name: 'Favorites', path: '/favorites' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Subscription', path: '/subscription' },
    { name: 'About Us', path: '/about' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
  ];

  // ✅ Your updated contact info
  const contactInfo = [
    { icon: Mail, text: 'justicenarh9@gmail.com', link: 'mailto:justicenarh9@gmail.com' },
    { icon: Phone, text: '+91 9815494702', link: 'tel:+919815494702' },
    { icon: Phone, text: '+233 0559423486', link: 'tel:+2330559423486' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">RentEasy</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Find your perfect home with ease. RentEasy connects tenants with landlords 
              for a seamless house renting experience.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>for renters</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index}>
                    <a
                      href={item.link}
                      className="flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect With Me</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 ${social.color}`}
                    title={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Let's connect and build something amazing together!
            </p>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
            <p>
              © {currentYear} RentEasy. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 sm:mt-0">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span>|</span>
              <p>
                Built with ❤️ by <span className="text-white font-medium">Narh Justice Tetteh</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;