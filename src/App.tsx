import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  GlassWater, 
  Utensils, 
  Music, 
  Compass, 
  Instagram, 
  Mail, 
  Globe, 
  Trash2, 
  CheckCircle, 
  Lock, 
  Menu, 
  X, 
  Send,
  Sparkles,
  Ticket,
  AlertCircle
} from 'lucide-react';

// Define Registration structure matching our server
interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  city: string;
  instagram: string;
  heardFrom: string;
  dietary: string;
  ticket: string;
  status: 'Pending Verification' | 'Verified';
  timestamp: string;
}

export default function App() {
  // Page routing state: 'home' | 'form' | 'success' | 'admin'
  const [currentTab, setCurrentTab] = useState<'home' | 'form' | 'success' | 'admin'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Generate floating background particles
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 2}px`,
      duration: `${Math.random() * 12 + 8}s`,
      delay: `${Math.random() * 10}s`
    }))
  );

  // Home Form Query states
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [querySuccess, setQuerySuccess] = useState(false);

  // Registration Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    city: '',
    instagram: '',
    heardFrom: '',
    dietary: 'No restrictions',
    ticket: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState({
    c1: false,
    c2: false,
    c3: false,
    c4: false,
  });

  // Flow State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1: Pay/QR, 2: Upload Proof Google Form
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [submittedProof, setSubmittedProof] = useState(false);

  // Admin states
  const [adminRegistrations, setAdminRegistrations] = useState<Registration[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Ticket Pricing config
  const pricingData = {
    t1: { name: 'Early Bird Female', amount: 899, label: 'Early Bird', sex: 'Female' },
    t2: { name: 'Early Bird Male', amount: 1299, label: 'Early Bird', sex: 'Male' },
    t3: { name: 'Couple (Entry for 2)', amount: 2000, label: 'Regular', sex: 'Couple' },
  };

  // Nav scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync route hash change to support directly landing on #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('home');
      }
    };
    handleHash(); // Run on mount
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch admin registrations list
  const fetchRegistrations = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      if (res.ok) {
        const data = await res.json();
        // Sort registrations to show pending ones first, then newest
        const sorted = data.sort((a: Registration, b: Registration) => {
          if (a.status === 'Pending Verification' && b.status === 'Verified') return -1;
          if (a.status === 'Verified' && b.status === 'Pending Verification') return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setAdminRegistrations(sorted);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'ignyt2026' || adminPassword === 'parth007') {
      setIsAdminAuthenticated(true);
      setAdminError('');
      fetchRegistrations();
    } else {
      setAdminError('Invalid authorization key');
    }
  };

  // Admin Verify registration (triggers verification email)
  const handleVerifyRegistration = async (id: string) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        // Refresh local admin list
        fetchRegistrations();
        alert('Ticket successfully verified! Official confirmation email sent to attendee.');
      }
    } catch (err) {
      console.error('Error verifying registration:', err);
    }
  };

  // Admin Delete registration
  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration? This is irreversible.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/registration', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchRegistrations();
      }
    } catch (err) {
      console.error('Error deleting registration:', err);
    }
  };

  // Contact Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuerySubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: queryName,
          email: queryEmail,
          message: queryMessage
        })
      });
      if (res.ok) {
        setQuerySuccess(true);
        setQueryName('');
        setQueryEmail('');
        setQueryMessage('');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
    } finally {
      setQuerySubmitting(false);
    }
  };

  // Form Field Validation
  const validateRegistration = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    const ageNum = parseInt(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 18) {
      errors.age = 'Age must be 18 or above (Valid photo ID is mandatory)';
    }

    if (!formData.gender) errors.gender = 'Gender selection is required';
    
    const phoneClean = formData.phone.trim();
    if (!phoneClean || phoneClean.length < 8) {
      errors.phone = 'Valid phone number is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Valid email is required';
    }

    if (!formData.city) errors.city = 'Coming city is required';
    if (!formData.heardFrom) errors.heardFrom = 'This field is required';
    if (!formData.ticket) errors.ticket = 'Please select a ticket option';

    const allConsented = Object.values(consents).every(val => val === true);
    if (!allConsented) {
      errors.consent = 'You must agree to all terms and conditions checkboxes to proceed';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger Registration flow
  const handleProceedToPayment = () => {
    if (!validateRegistration()) {
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        const el = document.getElementById(firstError);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // Form is verified, open payment flow
    setModalStep(1);
    setIsModalOpen(true);
  };

  // Save Registration details from Google Form integration and claim payment
  const handleConfirmDonePaymentProof = async () => {
    if (!submittedProof) {
      alert("Please upload your payment screenshot over the Google Form first and check the confirmation box to complete registration!");
      return;
    }
    setSubmittingRegistration(true);
    try {
      const selectedPricing = pricingData[formData.ticket as keyof typeof pricingData];
      const ticketDescription = `${selectedPricing.name} — ₹${selectedPricing.amount}`;

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          instagram: formData.instagram,
          heardFrom: formData.heardFrom,
          dietary: formData.dietary,
          ticket: ticketDescription
        })
      });

      if (res.ok) {
        setRegisteredEmail(formData.email);
        setIsModalOpen(false);
        setSubmittedProof(false);
        // Reset state
        setFormData({
          firstName: '',
          lastName: '',
          age: '',
          gender: '',
          phone: '',
          email: '',
          city: '',
          instagram: '',
          heardFrom: '',
          dietary: 'No restrictions',
          ticket: '',
        });
        setConsents({ c1: false, c2: false, c3: false, c4: false });
        setCurrentTab('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Could not submit details, please try again.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Error connecting to registration engine. Please retry.');
    } finally {
      setSubmittingRegistration(false);
    }
  };

  // Helper utility to safely navigate back to home
  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentTab('home');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#060606] text-[#F0EBE3] relative noise-overlay font-sans select-none pb-12">
      
      {/* BACKGROUND FLOATING PARTICLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute bg-[#C9A84C] rounded-full opacity-0"
            style={{
              left: p.left,
              width: p.width,
              height: p.width,
              animation: `float ${p.duration} linear infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* --- GLOBAL NAVIGATION --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] flex justify-between items-center px-6 md:px-12 py-5 transition-all duration-400 ${
        scrolled ? 'bg-[#060606]/95 border-b border-white/5 backdrop-blur-md py-4' : 'bg-transparent'
      }`}>
        <a 
          href="https://instagram.com/ignyt.co" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-left font-montserrat-extrabold text-base md:text-lg tracking-[0.3em] font-extrabold uppercase text-[#F0EBE3] hover:opacity-85 transition-opacity"
        >
          IGNYT<span className="text-[#C9A84C]">.</span>CO
        </a>

        <div className="flex items-center gap-8">
          <ul className="hidden md:flex gap-9 list-none">
            <li>
              <a href="#about" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                About
              </a>
            </li>
            <li>
              <a href="#events" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                Events
              </a>
            </li>
            <li>
              <a href="#contact" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                Contact
              </a>
            </li>
            <li>
              <button
                onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="font-sans text-[10px] tracking-[0.3em] text-[#C9A84C] border border-[#C9A84C]/40 px-5 py-2.5 uppercase transition-all duration-300 hover:bg-[#C9A84C] hover:text-[#060606]"
              >
                Register Now
              </button>
            </li>
          </ul>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden flex-col gap-1.5 cursor-pointer p-1 z-[201]"
          >
            <span className={`block w-[22px] h-[1px] bg-white transition-all transform origin-center ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block w-[22px] h-[1px] bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-[22px] h-[1px] bg-white transition-all transform origin-center ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* --- MOBILE DRAW-OUT MENU --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#060606]/98 z-[199] flex flex-col items-center justify-center gap-10 backdrop-blur-lg animate-modal-in">
          <a href="#about" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            About
          </a>
          <a href="#events" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            Events
          </a>
          <a href="#contact" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            Contact
          </a>
          <button
            onClick={() => { setMobileMenuOpen(false); setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="font-sans text-xs tracking-[0.4em] text-[#C9A84C] border border-[#C9A84C]/40 px-8 py-3.5 uppercase hover:bg-[#C9A84C] hover:text-[#060606] transition-all"
          >
            Register Now
          </button>
        </div>
      )}


      {/* =========================================
                     HOMEPAGE TAB
         ========================================= */}
      {currentTab === 'home' && (
        <>
          {/* HERO BANNER SECTION */}
          <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 pt-[120px] pb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-[#C9A84C]/5 to-transparent pointer-events-none" />
            
            <div className="font-sans text-[10px] tracking-[0.5em] text-[#C9A84C] uppercase mb-[28px] animate-rise">
              Chandigarh · Punjab · India
            </div>
            
            <h1 className="font-serif-cormorant font-light text-7xl md:text-8xl lg:text-[144px] leading-tight text-[#F0EBE3] tracking-tight mb-6 animate-rise">
              IGNYT<em className="not-italic text-[#C9A84C]">.</em>CO
            </h1>
            
            <div className="font-serif-cormorant italic font-light text-lg md:text-2xl lg:text-3xl text-[#F0EBE3]/40 tracking-[0.1em] mb-14 animate-rise">
              We Spark The Night.
            </div>
            
            <div className="w-[1px] h-16 bg-gradient-to-b from-[#C9A84C] to-transparent mb-14 animate-rise" />
            
            <div className="flex flex-wrap gap-4 justify-center animate-rise">
              <a 
                href="#events" 
                className="font-sans text-[10px] font-normal tracking-[0.4em] uppercase text-[#060606] bg-[#C9A84C] border border-[#C9A84C] px-10 py-4.5 hover:bg-transparent hover:text-[#C9A84C] transition-all duration-300"
              >
                Upcoming Events
              </a>
              <a 
                href="#about" 
                className="font-sans text-[10px] font-light tracking-[0.4em] uppercase text-[#F0EBE3]/40 bg-transparent border border-white/5 px-10 py-4.5 hover:border-[#F0EBE3]/30 hover:text-white transition-all duration-300"
              >
                Who We Are
              </a>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-rise">
              <span className="font-sans text-[8px] tracking-[0.4em] text-[#F0EBE3]/15 uppercase">Scroll</span>
              <div className="w-[1px] h-10 bg-gradient-to-b from-[#C9A84C] to-transparent animate-scroll-pulse" />
            </div>
          </div>

          {/* ABOUT SECTION */}
          <section id="about" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto">
            <div className="flex items-center gap-5 mb-14">
              <div className="font-sans text-[9px] font-light tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">About Us</div>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-serif-cormorant font-light text-4xl md:text-5xl lg:text-[56px] leading-[1.1] text-white mb-7">
                  We don't just plan events.<br /><em className="not-italic italic text-[#C9A84C]">We create nights</em> you remember.
                </h2>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-5">
                  IGNYT Co. is a Chandigarh-based event community built for the ones who want more than a predictable night. We craft immersive social experiences — from high-energy house gatherings and stylish pool sessions to exclusive prom nights and premium format events.
                </p>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-7">
                  Every gather is designed with absolute attention to detail. The music direction, the lighting structure, the handpicked crowd, and the physical vibes — everything is optimized so you walk in as an adventurer and walk out as a regular.
                </p>

                <div className="grid grid-cols-3 gap-[1px] bg-white/5 border border-white/5 mt-8">
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">01</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">Event Live</div>
                  </div>
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">25+</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">Attendees Expected</div>
                  </div>
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">∞</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">More Coming</div>
                  </div>
                </div>
              </div>

              <a 
                href="https://instagram.com/ignyt.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="border border-white/5 aspect-[3/4] flex flex-col items-center justify-center bg-[#0F0F0F] relative overflow-hidden group hover:border-[#C9A84C]/25 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-radial-gradient from-[#C9A84C]/8 via-transparent to-transparent" />
                <div className="font-sans font-light text-3xl tracking-[0.3em] text-white z-10 group-hover:text-[#C9A84C] transition-colors">
                  IGNYT<span className="text-[#C9A84C]">.</span>CO
                </div>
                <div className="font-serif-cormorant italic text-base text-[#F0EBE3]/40 mt-3 z-10 tracking-widest group-hover:text-white/60 transition-colors">
                  We Spark The Night.
                </div>
                <div className="font-serif-cormorant italic text-[80px] text-[#C9A84C]/5 font-light absolute bottom-5 right-5 leading-none">
                  IGN
                </div>
              </a>
            </div>
          </section>

          {/* EVENTS DISPLAY SECTION */}
          <section id="events" className="bg-[#0F0F0F] border-y border-white/5 py-24 px-6 md:px-12">
            <div className="max-w-[1100px] mx-auto">
              <div className="flex items-center gap-5 mb-14">
                <div className="font-sans text-[9px] font-light tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Upcoming Events</div>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              {/* ACTIVE EVENT CARD */}
              <div 
                onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-10 border-b border-white/5 border-t cursor-pointer hover:border-[#C9A84C]/30 transition-all duration-300"
              >
                <div className="max-w-[700px]">
                  <div className="font-sans font-light text-[9px] tracking-[0.4em] text-[#C9A84C] uppercase mb-3 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                    Registrations Open · Limited Slots
                  </div>
                  <h3 className="font-serif-cormorant font-light text-4xl md:text-5xl text-white tracking-wide group-hover:text-[#C9A84C] transition-colors duration-300 mb-3">
                    Summer Pool Party
                  </h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[#F0EBE3]/40 font-sans text-[10px] tracking-wider leading-relaxed">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#C9A84C]" /> Venue: <span className="text-white">Villa Ruhaniyat Farms, near cgc</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-[#C9A84C]" /> Date: <span className="text-white">13 June</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="text-[#C9A84C]" /> Time: <span className="text-white">8:00 PM — 2:00 AM</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={11} className="text-[#C9A84C]" /> Age limit: <span className="text-white">18+ Only</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="font-sans text-[9px] tracking-[0.3em] font-light uppercase px-[18px] py-2 border border-[#C9A84C]/30 text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-black transition-all">
                    Register Now
                  </div>
                  <span className="text-[#C9A84C] font-semibold opacity-40 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all text-xl">→</span>
                </div>
              </div>

              {/* UNRELEASED COMMING SOON CARD */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-10 border-b border-white/5 opacity-35 cursor-default select-none">
                <div>
                  <div className="font-sans font-light text-[9px] tracking-[0.4em] text-white/50 uppercase mb-3">
                    Coming Soon
                  </div>
                  <h3 className="font-serif-cormorant font-light text-4xl md:text-5xl text-white tracking-wide mb-3">
                    Prom Night
                  </h3>
                  <div className="flex flex-wrap gap-x-6 mt-4 text-white/30 font-sans text-[10px] tracking-wider">
                    <span>📍 Chandigarh & Around</span>
                    <span>📅 Date TBA</span>
                  </div>
                </div>
                <div>
                  <div className="font-sans text-[9px] tracking-[0.3em] font-light uppercase px-[18px] py-2 border border-white/10 text-white/40">
                    Stay Tuned
                  </div>
                </div>
              </div>

              {/* ANOTHER PLACEHOLDER CARD */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-10 border-b border-white/5 opacity-35 cursor-default select-none">
                <div>
                  <div className="font-sans font-light text-[9px] tracking-[0.4em] text-white/50 uppercase mb-3">
                    Coming Soon
                  </div>
                  <h3 className="font-serif-cormorant font-light text-4xl md:text-5xl text-white tracking-wide mb-3">
                    Autumn Sessions
                  </h3>
                  <div className="flex flex-wrap gap-x-6 mt-4 text-white/30 font-sans text-[10px] tracking-wider">
                    <span>📍 Chandigarh</span>
                    <span>📅 Watch This Space</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto">
            <div className="flex items-center gap-5 mb-14">
              <div className="font-sans text-[9px] font-light tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Get In Touch</div>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
              <div>
                <h2 className="font-serif-cormorant font-light text-4xl md:text-5xl lg:text-[52px] leading-[1.1] text-white mb-6">
                  Let's make<br /><em className="not-italic italic text-[#C9A84C]">something happen.</em>
                </h2>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-9">
                  Have an enquiry about host collaborations, brand partnerships, bulk cohort registrations, or just want to be notified about priority slots? Raise a ticket or reach out directly.
                </p>

                <div className="flex flex-col gap-5">
                  <a href="https://instagram.com/ignyt.co" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Instagram</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-[#C9A84C] transition-colors">ignyt.co</div>
                  </a>
                  <a href="tel:7496088484" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Contact Phone</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">7496088484</div>
                  </a>
                  <a href="mailto:ignyt@ignyt.co.in" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Email</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">ignyt@ignyt.co.in</div>
                  </a>
                  <a href="https://ignyt.co.in" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Website</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">ignyt.co.in</div>
                  </a>
                </div>
              </div>

              <div>
                {querySuccess ? (
                  <div className="bg-[#0F0F0F] border border-[#C9A84C]/30 p-8 text-center animate-pop-in">
                    <CheckCircle className="text-[#C9A84C] mx-auto mb-4" size={36} />
                    <h3 className="font-serif-cormorant font-light text-2xl text-white mb-2">Message Transmitted</h3>
                    <p className="font-sans font-light text-xs text-[#F0EBE3]/40 leading-relaxed max-w-sm mx-auto">
                      Thank you for contacting us. Parth Dua or one of our organizers will reach back to you at your verified email shortly.
                    </p>
                    <button 
                      onClick={() => setQuerySuccess(false)}
                      className="font-sans text-[8px] tracking-widest text-[#C9A84C] uppercase underline mt-5 hover:opacity-85"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Name" 
                      required 
                      value={queryName}
                      onChange={e => setQueryName(e.target.value)}
                    />
                    <input 
                      type="email" 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Email" 
                      required 
                      value={queryEmail}
                      onChange={e => setQueryEmail(e.target.value)}
                    />
                    <textarea 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full min-h-[120px] resize-y focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Message..." 
                      required
                      value={queryMessage}
                      onChange={e => setQueryMessage(e.target.value)}
                    />

                    <button 
                      type="submit" 
                      disabled={querySubmitting}
                      className="bg-[#C9A84C] border border-[#C9A84C] text-[#060606] font-sans font-normal text-[10px] p-[16px] tracking-[0.4em] uppercase hover:bg-transparent hover:text-[#C9A84C] transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {querySubmitting ? 'Sending Message...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </>
      )}


      {/* =========================================
                   REGISTRATION FORM TAB
         ========================================= */}
      {currentTab === 'form' && (
        <div className="px-6 md:px-12 max-w-[820px] mx-auto pt-[125px] pb-12">
          
          <div className="text-center relative pb-10 border-b border-white/5 mb-11">
            <button 
              onClick={navigateToHome}
              className="absolute top-0 left-0 text-xs tracking-widest text-[#F0EBE3]/40 hover:text-[#C9A84C] uppercase flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div className="font-montserrat-extrabold text-xl tracking-[0.25em] font-extrabold uppercase mb-2">
              IGNYT<span className="text-[#C9A84C]">.</span>CO
            </div>
            <div className="font-sans text-[8px] tracking-[0.5em] text-[#C9A84C] uppercase mb-4 font-light">Presents</div>
            <h1 className="font-serif-cormorant font-light text-5xl md:text-7xl text-white tracking-wide">
              Summer Pool Party
            </h1>

            {/* EVENT SPECS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 border border-white/5 mt-11 text-left bg-[#0A0A0A]">
              <div className="p-6 border-r border-b border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Venue</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">Villa Ruhaniyat Farms</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">by Urban Oasis near cgc, Mohali</div>
              </div>
              <div className="p-6 border-b md:border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Date</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">13 June</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Saturday Showcase</div>
              </div>
              <div className="p-6 border-r md:border-r-0 border-b border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Time</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">8:00 PM — 2:00 AM</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Gates close strictly at 9:30 PM</div>
              </div>
              <div className="p-6 border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Dress Code</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">All Black</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">+ Neon accessories</div>
              </div>
              <div className="p-6 border-r md:border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Age Limit</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">18+ Only</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Valid physical ID mandatory</div>
              </div>
              <div className="p-6">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Drinks</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">BYOB</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Welcome drinks included</div>
              </div>
            </div>
          </div>

          {/* WHAT'S INCLUDED ROW */}
          <div className="flex items-center gap-5 mt-14 mb-8">
            <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">What's Included</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-14">
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🍹</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Drinks On Us</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                <strong className="text-[#C9A84C] font-normal">1–2 premium welcome drinks are included</strong> with every pass type. BYOB is encouraged — bring your choices for the remainder of the night.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🍽️</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Meals On Us</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                No outside catering is needed. <strong className="text-[#C9A84C] font-normal">Splendid, piping hot meals are fully sorted</strong> inside the compound. Come hungry, leave completely satisfied.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🎵</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">All Night Sounds</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                Crystals and deep bass. Non-stop, custom-curated underground tracks playing live from <strong className="text-[#C9A84C] font-normal">8:00 PM all the way through 2:00 AM</strong>.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🏊</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Pool Activities & Games</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                Noodle jousting, deep-water volleyball, synchro jumps, and bespoke ambient glow accessories for a picture-perfect aquatic session.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🤝</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">High-Context Connections</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                No typical noisy club cliqueyness. We design interactions with structured breaks, games, and dynamic icebreakers to get you conversing instantly.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🎲</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Group Party Games</h4>
              <p className="font-sans text-xs font-light text-[#F0EBE3]/40 leading-relaxed">
                Drunk Jenga towers, high-stakes Truth or Dare cards, custom Never Have I Ever rounds, and quick-fire flip cup relay tracks.
              </p>
            </div>
          </div>

          {/* TICKET PRICING LISTING */}
          <div className="flex items-center gap-5 mb-8">
            <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Ticket Pricing</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-14">
            <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 p-7 text-center relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0F0F0F]">
              <span className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] font-normal uppercase mb-3 block">⚡ Early Bird</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Female Entry Pass</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/40 mr-1">₹</span>899
              </div>
              <span className="font-sans text-[8px] text-[#F0EBE3]/20 mt-3 block tracking-widest text-[#C9A84C]/80">Extremely Limited Quantities</span>
            </div>
            
            <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 p-7 text-center relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0F0F0F]">
              <span className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] font-normal uppercase mb-3 block">⚡ Early Bird</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Male Entry Pass</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/40 mr-1">₹</span>1,299
              </div>
              <span className="font-sans text-[8px] text-[#F0EBE3]/20 mt-3 block tracking-widest text-[#C9A84C]/80">Extremely Limited Quantities</span>
            </div>

            <div className="bg-[#0F0F0F] border border-white/5 p-7 text-center hover:border-[#C9A84C]/35 transition-colors">
              <span className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] font-normal uppercase mb-3 block">Couple Special Pass</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Couple Entry (2 Persons)</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/40 mr-1">₹</span>2,000
              </div>
              <span className="font-sans text-[8px] text-[#F0EBE3]/20 mt-3 block tracking-widest">Entry valid for standard mixed pairs only</span>
            </div>
          </div>

          {/* ATTENDEE FORM REGISTRATION */}
          <div className="flex items-center gap-5 mb-8">
            <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Attendee Registration</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">First Name *</label>
                <input 
                  type="text" 
                  className={`bg-[#0F0F0F] border ${formErrors.firstName ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={e => {
                    setFormData({...formData, firstName: e.target.value});
                    if(formErrors.firstName) setFormErrors({...formErrors, firstName: ''});
                  }}
                />
                {formErrors.firstName && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.firstName}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Last Name *</label>
                <input 
                  type="text" 
                  className={`bg-[#0F0F0F] border ${formErrors.lastName ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={e => {
                    setFormData({...formData, lastName: e.target.value});
                    if(formErrors.lastName) setFormErrors({...formErrors, lastName: ''});
                  }}
                />
                {formErrors.lastName && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.lastName}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Age * (Must be 18+)</label>
                <input 
                  type="number" 
                  className={`bg-[#0F0F0F] border ${formErrors.age ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="Valid Age (Mandatory)"
                  min="18"
                  max="60"
                  value={formData.age}
                  onChange={e => {
                    setFormData({...formData, age: e.target.value});
                    if(formErrors.age) setFormErrors({...formErrors, age: ''});
                  }}
                />
                {formErrors.age && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.age}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Gender *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.gender ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.gender}
                    onChange={e => {
                      setFormData({...formData, gender: e.target.value});
                      if(formErrors.gender) setFormErrors({...formErrors, gender: ''});
                    }}
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer Not To Say">Prefer not to say</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.gender && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.gender}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Phone Number *</label>
                <input 
                  type="tel" 
                  className={`bg-[#0F0F0F] border ${formErrors.phone ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={e => {
                    setFormData({...formData, phone: e.target.value});
                    if(formErrors.phone) setFormErrors({...formErrors, phone: ''});
                  }}
                />
                {formErrors.phone && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.phone}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Email Address *</label>
                <input 
                  type="email" 
                  className={`bg-[#0F0F0F] border ${formErrors.email ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={e => {
                    setFormData({...formData, email: e.target.value});
                    if(formErrors.email) setFormErrors({...formErrors, email: ''});
                  }}
                />
                {formErrors.email && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">City of Origin *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.city ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.city}
                    onChange={e => {
                      setFormData({...formData, city: e.target.value});
                      if(formErrors.city) setFormErrors({...formErrors, city: ''});
                    }}
                  >
                    <option value="" disabled>Where are you traveling from?</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Mohali">Mohali</option>
                    <option value="Panchkula">Panchkula</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Amritsar">Amritsar</option>
                    <option value="Delhi / NCR">Delhi / NCR</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.city && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.city}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Instagram Handle</label>
                <input 
                  type="text" 
                  className="bg-[#0F0F0F] border border-white/5 text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic"
                  placeholder="@yourhandle"
                  value={formData.instagram}
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">How Did You Hear About Us? *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.heardFrom ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.heardFrom}
                    onChange={e => {
                      setFormData({...formData, heardFrom: e.target.value});
                      if(formErrors.heardFrom) setFormErrors({...formErrors, heardFrom: ''});
                    }}
                  >
                    <option value="" disabled>Select Referral Channels</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Friend">Friend Referral</option>
                    <option value="WhatsApp">WhatsApp Community</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other Marketing</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.heardFrom && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.heardFrom}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Dietary Guidelines</label>
                <div className="relative">
                  <select 
                    className="bg-[#0F0F0F] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none"
                    value={formData.dietary}
                    onChange={e => setFormData({...formData, dietary: e.target.value})}
                  >
                    <option value="No restrictions">No restrictions</option>
                    <option value="Vegetarian">Vegetarian Only</option>
                    <option value="Vegan">Vegan Only</option>
                    <option value="Halal">Halal Choice</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
              </div>

            </div>

            {/* TICKET TYPE SELECTOR INPUT */}
            <div className="flex flex-col gap-3 mt-4" id="ticket">
              <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Select Your Pass Type *</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't1' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t1" 
                    checked={formData.ticket === 't1'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't1'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#C9A84C] mb-1">⚡ Female</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Early Pass Female</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹899</span>
                </label>

                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't2' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t2" 
                    checked={formData.ticket === 't2'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't2'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#C9A84C] mb-1">⚡ Male</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Early Pass Male</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹1,299</span>
                </label>

                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't3' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t3" 
                    checked={formData.ticket === 't3'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't3'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#F0EBE3]/30 mb-1">Pass For 2</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Couple Entry Pass</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹2,000</span>
                </label>
              </div>

              {formErrors.ticket && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.ticket}</span>}
            </div>

            {/* TERMS ACCORDION LIST */}
            <div className="flex items-center gap-5 mt-10 mb-6">
              <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Terms & Conditions</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <ul className="list-none border border-white/5 bg-[#0F0F0F] rounded-sm divide-y divide-white/5">
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">01</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  This event is strictly <strong className="text-white font-semibold">18 years of age or older</strong>. Valid government-issued photo ID is mandatory at physical entry. No exceptions.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">02</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  <strong className="text-white font-semibold">Zero tolerance for narcotics or illegal contraband.</strong> Anyone caught violating state laws will be instantly escorted off-property and handed over to relevant law agencies.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">03</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  IGNYT Co. preserves absolute administrative authority to <strong className="text-white font-semibold">revoke entry or escort guests out</strong> of the site at any mark if found breaking code or behaving improperly, without reimbursement.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">04</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  By registering, you granting IGNYT Co. full legal <strong className="text-white font-semibold">permission to photograph and capture video footage</strong> of the pool party for use on social media formats (Instagram, YouTube, etc.) without royalty claims.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">05</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  Passes are completely <strong className="text-white font-semibold">non-transferable and non-refundable</strong> once generated. In rare force-majeure cases of organizer cancellation, a prompt refund will be sorted.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">06</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  BYOB is permitted within healthy moral constraints. Organizers maintain zero liability for individual safety or actions on heavily intoxicated guests.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">07</span>
                <p className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed tracking-wider">
                  Dress guidelines strictly demand <strong className="text-white font-semibold">All Black garments optionally accented with glowing/Neon options</strong>. Entry is forbidden for non-compliance.
                </p>
              </li>
            </ul>

            {/* CONSENT AND RULES ASSURANCE */}
            <div className="flex items-center gap-5 mt-10 mb-6">
              <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Assurances & Consent</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <div className="flex flex-col gap-4" id="consent">
              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/5 bg-[#0F0F0F] mt-1 accent-[#C9A84C]"
                  checked={consents.c1}
                  onChange={e => {
                    setConsents({...consents, c1: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed">
                  I confirm that I am <strong className="text-white font-semibold">18 years of age or older</strong> and will have an official physical government photo ID with me for registration checks at the gate.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/5 bg-[#0F0F0F] mt-1 accent-[#C9A84C]"
                  checked={consents.c2}
                  onChange={e => {
                    setConsents({...consents, c2: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed">
                  I agree that <strong className="text-white font-semibold">IGNYT Co. may photograph and capture high-definition video</strong> of the gather to use globally for marketing, reels, recaps, and catalogs without legal bounds.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/5 bg-[#0F0F0F] mt-1 accent-[#C9A84C]"
                  checked={consents.c3}
                  onChange={e => {
                    setConsents({...consents, c3: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed">
                  I understand that <strong className="text-white font-semibold">illicit narcotics are absolutely prohibited</strong> in any shape. I accept that organizers holds the full legal privilege to immediately report me or banish me if caught using.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/5 bg-[#0F0F0F] mt-1 accent-[#C9A84C]"
                  checked={consents.c4}
                  onChange={e => {
                    setConsents({...consents, c4: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-[11px] font-light text-[#F0EBE3]/40 leading-relaxed">
                  I have read, understood, and voluntarily agree to comply with all <strong className="text-white font-semibold">Terms & Conditions</strong>. I acknowledge that passes are non-refundable.
                </span>
              </label>

              {formErrors.consent && <span className="font-sans text-[10px] text-red-400 tracking-wider mt-1">{formErrors.consent}</span>}
            </div>

            <div className="text-center mt-12 mb-8">
              <button 
                type="button" 
                onClick={handleProceedToPayment}
                className="font-sans text-xs tracking-[0.4em] font-normal uppercase text-[#C9A84C] bg-transparent border border-[#C9A84C] px-16 py-5 cursor-pointer max-w-full hover:bg-[#C9A84C] hover:text-[#060606] transition-all duration-300"
              >
                Proceed to Payment
              </button>
              <div className="font-sans text-[9px] tracking-[0.2em] text-[#F0EBE3]/15 uppercase mt-5">
                Scan UPI QR Code to verify admission
              </div>
            </div>

          </form>

        </div>
      )}


      {/* =========================================
                   SUCCESS VIEW TAB
         ========================================= */}
      {currentTab === 'success' && (
        <div className="px-6 md:px-12 max-w-[620px] mx-auto text-center pt-[150px] pb-12 animate-rise">
          <span className="text-5xl mb-6 inline-block animate-pop-in">🎉</span>
          <h1 className="font-serif-cormorant font-light text-5xl md:text-7xl text-white tracking-wide mb-3 italic">
            You're In.
          </h1>
          <div className="font-sans text-[10px] tracking-[0.4em] text-[#C9A84C] uppercase mb-8">
            Registration Recieved
          </div>
          
          <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mb-8 opacity-50" />

          <p className="font-sans font-light text-sm text-[#F0EBE3]/60 leading-relaxed tracking-wider mb-10">
            Your spot has been earmarked for the legendary <strong className="text-white font-medium">Summer Pool Party</strong> by IGNYT Co.<br /><br />
            We have dispatched a notification summary to <strong className="text-[#C9A84C] font-normal">{registeredEmail}</strong>.<br />
            Since tickets require confirmation of payment, make sure you uploaded the invoice screenshot inside the payment form. Parth Dua (<strong className="text-white font-normal">parthdua007@gmail.com</strong>) will check your submission against Google Form receipts and verify your seat shortly!<br /><br />
            Follow <strong className="text-[#C9A84C]">@ignyt.co</strong> on Instagram to catch direct updates on specific announcements!
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://instagram.com/ignyt.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-sans text-[9px] tracking-[0.35em] text-[#060606] bg-[#C9A84C] border border-[#C9A84C] px-10 py-5 uppercase hover:bg-transparent hover:text-[#C9A84C] transition-all"
            >
              Follow @ignyt.co
            </a>
            <button 
              onClick={navigateToHome}
              className="font-sans text-[9px] tracking-[0.35em] text-[#F0EBE3]/50 bg-transparent border border-white/5 px-10 py-5 uppercase hover:border-white/20 hover:text-white transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}


      {/* =========================================
                   ADMIN VIEWER TAB
         ========================================= */}
      {currentTab === 'admin' && (
        <div className="px-6 md:px-12 max-w-[1200px] mx-auto pt-[125px] pb-12">
          
          <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-11">
            <div className="text-left">
              <h1 className="font-serif-cormorant font-light text-4xl text-white tracking-wider flex items-center gap-2">
                <Lock className="text-[#C9A84C]" size={24} /> Admin Dashboard
              </h1>
              <p className="font-sans text-[9px] tracking-widest text-[#C9A84C] uppercase mt-1">
                Attendee Verification Portal · parthdua007@gmail.com
              </p>
            </div>
            
            <button 
              onClick={navigateToHome}
              className="font-sans text-[10px] tracking-widest text-[#F0EBE3]/40 hover:text-[#C9A84C] uppercase flex items-center gap-1.5 border border-white/5 px-4 py-2 hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={12} /> Back
            </button>
          </div>

          {!isAdminAuthenticated ? (
            <div className="max-w-[440px] mx-auto bg-[#0F0F0F] border border-white/5 p-10 text-center rounded">
              <Sparkles className="text-[#C9A84C] mx-auto mb-4 animate-pulse" size={32} />
              <h3 className="font-serif-cormorant text-2xl text-white mb-2">Internal Clearance Needed</h3>
              <p className="font-sans font-light text-xs text-[#F0EBE3]/40 leading-relaxed mb-6">
                Please enter the security password or owner key to load current registrations and verify screenshots.
              </p>
              
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  placeholder="Clearance Key" 
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="bg-[#060606] border border-white/10 text-white font-sans text-center text-sm p-4 tracking-widest outline-none focus:border-[#C9A84C] transition-colors"
                />
                
                {adminError && <span className="text-xs text-red-400 tracking-wide block">{adminError}</span>}

                <button 
                  type="submit"
                  className="bg-[#C9A84C] text-[#060606] font-sans text-[10px] tracking-[0.3em] uppercase p-4 hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] transition-all"
                >
                  Verify Access
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-rise">
              
              {/* ADMIN CONTROLS ROW */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F] border border-white/5 p-6 mb-8 rounded">
                <div>
                  <h3 className="font-serif-cormorant text-2xl text-white font-light">Registrations Database</h3>
                  <p className="font-sans text-[10px] text-[#F0EBE3]/30 tracking-wider mt-1">
                    Please cross-reference emails here with the uploaded payment proof in Google Forms on parthdua007@gmail.com
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={fetchRegistrations}
                    disabled={adminLoading}
                    className="font-sans text-[9px] tracking-widest text-[#C9A84C] border border-[#C9A84C]/35 bg-transparent px-5 py-3 uppercase hover:bg-[#C9A84C] hover:text-black transition-all disabled:opacity-40"
                  >
                    {adminLoading ? 'Syncing...' : 'Force Reload list'}
                  </button>
                  <a 
                    href="https://docs.google.com/forms/d/e/1FAIpQLSexh4WDQR8D_hzRUELWFsGZnvMqwOkHCtb_sy269s7bk1LIug/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/50 border border-white/5 bg-transparent px-5 py-3 uppercase hover:border-[#C9A84C]/35 hover:text-white transition-all text-center"
                  >
                    Check Google Form
                  </a>
                </div>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-[#F0EBE3]/30 uppercase mb-1">Total Bookings</div>
                  <div className="font-serif-cormorant text-4xl text-white font-light">{adminRegistrations.length}</div>
                </div>
                <div className="bg-[#0F0F0F] border border-[#C9A84C]/20 p-5 rounded bg-[#C9A84C]/5">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-[#C9A84C] uppercase mb-1">Verified Slots</div>
                  <div className="font-serif-cormorant text-4xl text-[#C9A84C] font-semibold">
                    {adminRegistrations.filter(r => r.status === 'Verified').length}
                  </div>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-orange-400 uppercase mb-1">Pending Verification</div>
                  <div className="font-serif-cormorant text-4xl text-orange-400 font-semibold">
                    {adminRegistrations.filter(r => r.status === 'Pending Verification').length}
                  </div>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-green-400 uppercase mb-1">Est. Collected Net</div>
                  <div className="font-serif-cormorant text-4xl text-green-400 font-semibold">
                    ₹{adminRegistrations
                      .filter(r => r.status === 'Verified')
                      .reduce((acc, curr) => {
                        if (curr.ticket.includes('899')) return acc + 899;
                        if (curr.ticket.includes('1,299') || curr.ticket.includes('1299')) return acc + 1299;
                        if (curr.ticket.includes('2,000') || curr.ticket.includes('2000')) return acc + 2000;
                        return acc;
                      }, 0).toLocaleString('en-IN')
                    }
                  </div>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              {adminRegistrations.length === 0 ? (
                <div className="bg-[#0F0F0F] border border-white/5 p-16 text-center rounded">
                  <AlertCircle className="text-[#F0EBE3]/20 mx-auto mb-3" size={32} />
                  <p className="font-sans text-xs text-[#F0EBE3]/30 tracking-wider">No attendee records currently present on the system.</p>
                </div>
              ) : (
                <div className="bg-[#0F0F0F] border border-white/5 rounded overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0A0A0A]/80 font-sans text-[8px] tracking-[0.3em] text-[#C9A84C] uppercase">
                        <th className="p-4 py-4.5 font-normal">Attendee</th>
                        <th className="p-4 py-4.5 font-normal">Contact</th>
                        <th className="p-4 py-4.5 font-normal">Instagram</th>
                        <th className="p-4 py-4.5 font-normal">Origin</th>
                        <th className="p-4 py-4.5 font-normal">Pass Info</th>
                        <th className="p-4 py-4.5 font-normal">Status</th>
                        <th className="p-4 py-4.5 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4">
                            <div className="font-serif-cormorant text-lg text-white font-medium">{r.firstName} {r.lastName}</div>
                            <div className="font-sans text-[9px] text-[#F0EBE3]/35 tracking-widest uppercase mt-0.5">
                              ID: {r.id} · Age: {r.age} · {r.gender}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-sans text-xs text-white/80">{r.email}</div>
                            <div className="font-sans text-xs text-[#F0EBE3]/45 tracking-wide mt-1">{r.phone}</div>
                          </td>
                          <td className="p-4">
                            {r.instagram && r.instagram !== 'Not shared' ? (
                              <a 
                                href={`https://instagram.com/${r.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-sans text-xs text-[#C9A84C] hover:underline flex items-center gap-1"
                              >
                                <Instagram size={11} /> {r.instagram}
                              </a>
                            ) : (
                              <span className="font-sans text-xs text-[#F0EBE3]/20">None</span>
                            )}
                          </td>
                          <td className="p-4 font-sans text-xs text-white/70">
                            <div>{r.city}</div>
                            <div className="text-[9px] text-[#F0EBE3]/20 tracking-wide mt-0.5">Heard: {r.heardFrom}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-serif-cormorant text-base text-white">{r.ticket}</div>
                            <div className="font-sans text-[9px] text-[#F0EBE3]/20 tracking-wider mt-0.5">Diet: {r.dietary}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block font-sans text-[8px] tracking-widest uppercase px-2.5 py-1 rounded-sm border ${
                              r.status === 'Verified'
                                ? 'text-green-400 bg-green-400/5 border-green-400/20'
                                : 'text-orange-400 bg-orange-400/5 border-orange-400/20 animate-pulse'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {r.status !== 'Verified' && (
                                <button 
                                  onClick={() => handleVerifyRegistration(r.id)}
                                  className="font-sans text-[8px] tracking-widest uppercase text-black bg-[#C9A84C] hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] px-3 py-1.5 transition-all"
                                >
                                  ✓ Verify Payment
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteRegistration(r.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-white/5 p-2 rounded transition-colors"
                                title="Delete attendee"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>
      )}


      {/* =========================================
                   PAYMENT MODAL
         ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#060606]/92 z-[500] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 max-w-[520px] w-full p-8 md:p-10 text-center relative animate-modal-in rounded my-8 max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-5 text-[#F0EBE3]/30 hover:text-white text-2xl p-1 transition-colors outline-none"
            >
              ×
            </button>

            <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2">Complete Reservation</div>
            <h3 className="font-serif-cormorant text-2xl font-light text-white mb-1">
              {pricingData[formData.ticket as keyof typeof pricingData]?.name || 'Pass Admission'}
            </h3>
            
            <div className="font-serif-cormorant text-4xl md:text-5xl text-[#C9A84C] font-semibold leading-none mb-6">
              <span className="text-xl font-light mr-0.5">₹</span>
              {(pricingData[formData.ticket as keyof typeof pricingData]?.amount || 0).toLocaleString('en-IN')}
            </div>

            {/* PROGRESS STEP DOTS */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <button 
                onClick={() => setModalStep(1)}
                className={`font-sans text-[8px] tracking-[0.2em] uppercase pb-1 border-b ${
                  modalStep === 1 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-white/30'
                }`}
              >
                1. Scan & Pay
              </button>
              <button 
                onClick={() => setModalStep(2)}
                className={`font-sans text-[8px] tracking-[0.2em] uppercase pb-1 border-b ${
                  modalStep === 2 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-white/30'
                }`}
              >
                2. Upload Proof
              </button>
            </div>

            {/* STEP 1: SCAN AND PAY */}
            {modalStep === 1 && (
              <div className="animate-rise">
                <div className="bg-white p-4 inline-block mb-3 rounded shadow">
                  {/* Real Dynamic Generated UPI QR Code */}
                  <div className="flex flex-col items-center justify-center p-2 text-[#111] font-sans">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=000000&data=${encodeURIComponent(`upi://pay?pa=parthdua70-3@okicici&pn=IGNYT%20CO&am=${pricingData[formData.ticket as keyof typeof pricingData]?.amount || 0}&cu=INR`)}`}
                      alt="UPI Scan to Pay QR Code"
                      className="w-[180px] h-[180px] object-contain border border-gray-200 p-1"
                      referrerPolicy="no-referrer"
                    />
                    <p className="font-bold text-xs tracking-tight uppercase mt-2 text-black">Rs. {pricingData[formData.ticket as keyof typeof pricingData]?.amount || 0} INR</p>
                    <p className="text-[7.5px] tracking-widest text-[#C9A84C] uppercase font-bold mt-1">Official IGNYT Pool Pass QR</p>
                    <div className="mt-1.5 text-[7px] text-[#111]/70 font-mono word-break-all bg-[#111]/5 px-2 py-0.5 select-all pointer-events-auto">parthdua70-3@okicici</div>
                  </div>
                </div>

                <div className="font-sans text-[10px] tracking-wide text-[#F0EBE3]/50 leading-relaxed mb-4">
                  Open any UPI App (GPay, PhonePe, Paytm, etc.) and scan the QR above or pay to our Official Handle:
                  <strong className="text-white block text-sm font-semibold tracking-wide select-all mt-1 pointer-events-auto bg-black/40 py-2.5 rounded border border-white/[0.03]">
                    parthdua70-3@okicici
                  </strong>
                </div>

                <div className="w-10 h-[1.5px] bg-[#C9A84C]/30 mx-auto mb-6" />

                <button 
                  onClick={() => setModalStep(2)}
                  className="w-full bg-[#C9A84C] text-black font-sans text-[9px] tracking-[0.3em] uppercase p-4 hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] transition-all"
                >
                  Next: Submit Payment Proof →
                </button>
              </div>
            )}

            {/* STEP 2: EMBEDDED GOOGLE FORM SCREEN */}
            {modalStep === 2 && (
              <div className="animate-rise">
                <div className="text-left mb-4">
                  <h4 className="font-serif-cormorant text-lg text-[#C9A84C] font-light mb-1">Verify Upload Proof</h4>
                  <p className="font-sans text-[9px] text-[#F0EBE3]/40 tracking-wider">
                    Please use the integrated form below to key in details and upload your screenshot proof directly. 
                  </p>
                </div>

                {/* EMEDDED GOOGLE FORM IFRAME */}
                <div className="bg-white rounded overflow-hidden mb-5 h-[340px] border border-white/10 shadow relative">
                  <iframe 
                    src="https://docs.google.com/forms/d/e/1FAIpQLSexh4WDQR8D_hzRUELWFsGZnvMqwOkHCtb_sy269s7bk1LIug/viewform?embedded=true" 
                    className="w-full h-full border-0 absolute inset-0 bg-white" 
                    title="Payment Proof Upload Google Form"
                  >
                    Loading Form...
                  </iframe>
                </div>

                {/* CONFIRM UPLOAD CHECKBOX (MANDATORY TO COMPLETE RESERVATION) */}
                <div className="bg-[#151515] border border-[#C9A84C]/25 p-4 rounded mb-5 flex items-start gap-3 text-left">
                  <input 
                    type="checkbox" 
                    id="submittedProofCheckbox"
                    className="w-4 h-4 rounded border-white/10 bg-[#0F0F0F] mt-0.5 accent-[#C9A84C] cursor-pointer"
                    checked={submittedProof}
                    onChange={e => setSubmittedProof(e.target.checked)}
                  />
                  <label htmlFor="submittedProofCheckbox" className="font-sans text-[10.5px] font-light text-white/80 leading-relaxed cursor-pointer select-none">
                    I confirm that I have <span className="text-[#C9A84C] font-semibold">uploaded my payment screenshot/proof</span> on the Google Form above. I understand my registration will be verified against this proof.
                  </label>
                </div>

                <div className="font-sans text-[9.5px] text-[#F0EBE3]/40 leading-relaxed tracking-wider mb-6 text-left">
                  💡 <span className="text-[#C9A84C]">Guide:</span> Make sure you submitted the Google Form inside the panel above before continuing. Once done, click the button below to secure your registration slot inside our secure directory!
                </div>

                <div className="flex gap-2.5">
                  <button 
                    onClick={() => setModalStep(1)}
                    className="w-1/3 border border-white/5 bg-transparent text-[#F0EBE3]/40 hover:text-white font-sans text-[9px] tracking-wider uppercase p-4"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleConfirmDonePaymentProof}
                    disabled={submittingRegistration || !submittedProof}
                    className="w-2/3 bg-[#C9A84C] text-black font-sans text-[9.5px] tracking-[0.25em] h-[50px] uppercase hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:bg-[#C9A84C] disabled:hover:text-black cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submittingRegistration ? 'Securing Slot...' : '✓ Done & Claim Ticket'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* --- FOOTER MAIN --- */}
      <footer className="px-6 md:px-12 max-w-[1100px] mx-auto pt-14 border-t border-white/5 flex flex-wrap justify-between items-center gap-6 mt-20 relative z-30">
        <div>
          <a 
            href="https://instagram.com/ignyt.co" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-sans text-xs tracking-widest text-[#F0EBE3] opacity-60 hover:text-[#C9A84C] transition-colors"
          >
            IGNYT<span className="text-[#C9A84C]">.</span>CO
          </a>
          <div className="font-serif-cormorant text-xs italic text-[#F0EBE3]/20 tracking-wider mt-1">
            We Spark The Night.
          </div>
        </div>

        <div className="flex gap-5">
          <button 
            onClick={navigateToHome}
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors"
          >
            Register
          </button>
          <a 
            href="#admin"
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors flex items-center gap-1.5"
          >
            <Lock size={10} /> Admin Panel
          </a>
        </div>

        <div className="font-sans text-[9px] font-extralight tracking-widest text-[#F0EBE3]/20 uppercase w-full text-center pt-6 border-t border-white/[0.02] mt-6">
          © 2026 IGNYT Co. · ignyt.co.in · Chandigarh, India · All rights reserved.
        </div>
      </footer>

    </div>
  );
}
