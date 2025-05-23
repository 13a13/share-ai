import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  BadgeCheck,
  ArrowRight,
  Brain,
  Shield,
  Smartphone
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/14a8bc8f-617c-43d9-90e5-bdc8b7bf3749.png" 
              alt="VerifyVision AI Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-xl font-bold bg-gradient-to-r from-verifyvision-gradient-start to-verifyvision-gradient-end bg-clip-text text-transparent">
              VerifyVision AI
            </span>
          </div>
          
          <nav className="ml-auto hidden md:flex gap-6">
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </a>
            <a href="#ai-technology" className="text-sm font-medium transition-colors hover:text-primary">
              AI Technology
            </a>
            <a href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </a>
          </nav>
          
          <div className="ml-auto md:ml-4 flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button variant="gradient" asChild className="hidden sm:flex">
              <Link to="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Property Inspections,{" "}
                    <span className="bg-gradient-to-r from-verifyvision-gradient-start to-verifyvision-gradient-end bg-clip-text text-transparent">
                      Powered by AI
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Streamline your property inspections with our AI-powered platform that automates documentation and analysis.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" variant="gradient" asChild>
                    <Link to="/register">Start Your Free Trial</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#how-it-works">Learn More</a>
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No credit card required</span>
                </div>
              </div>
              <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <div className="aspect-video overflow-hidden rounded-xl shadow-xl">
                  <img
                    alt="Property inspection with AI"
                    className="object-cover w-full h-full"
                    src="https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=1200&auto=format&fit=crop"
                    width={550}
                    height={310}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Benefit Banner */}
        <section className="bg-gradient-to-r from-verifyvision-gradient-start to-verifyvision-gradient-end py-12">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center text-white space-y-4">
              <Clock className="h-12 w-12" />
              <h2 className="text-3xl font-bold tracking-tight">
                Reduce Time Spent Inside Properties by Half!
              </h2>
              <p className="max-w-[800px] text-white/90 md:text-xl/relaxed">
                Our AI technology allows you to capture images while our system automatically documents and analyzes property conditions, cutting inspection time dramatically.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
                <p className="max-w-[800px] text-gray-500 md:text-xl/relaxed">
                  Our platform simplifies the property inspection process from start to finish
                </p>
              </div>
            </div>
            <div className="mx-auto grid gap-8 md:gap-12 mt-8 md:mt-16 max-w-5xl grid-cols-1 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Capture Photos</h3>
                  <p className="text-gray-500">
                    Take photos of rooms and items with your smartphone or tablet
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI Analysis</h3>
                  <p className="text-gray-500">
                    Our AI analyzes photos to identify items and their condition
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Generate Reports</h3>
                  <p className="text-gray-500">
                    Instantly create professional inspection reports ready for sharing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful Features</h2>
                <p className="max-w-[800px] text-gray-500 md:text-xl/relaxed">
                  Everything you need to transform your property inspection workflow
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="flex items-start gap-4">
                      <BadgeCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Automatic Room & Item Recognition</h3>
                        <p className="text-gray-500">
                          AI identifies rooms and items automatically from your photos
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-4">
                      <BadgeCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Condition Assessment</h3>
                        <p className="text-gray-500">
                          Our AI evaluates and documents the condition of items and surfaces
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-start gap-4">
                      <BadgeCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Professional PDF Reports</h3>
                        <p className="text-gray-500">
                          Generate comprehensive, branded reports ready to share with clients
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mx-auto w-full max-w-sm lg:max-w-none aspect-square overflow-hidden rounded-xl shadow-lg">
                <img
                  alt="Feature illustration"
                  className="object-cover w-full h-full"
                  src="https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop"
                />
              </div>
            </div>
          </div>
        </section>

        {/* AI Technology Section */}
        <section id="ai-technology" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="mx-auto w-full max-w-sm lg:max-w-none">
                <div className="aspect-square overflow-hidden rounded-xl shadow-lg">
                  <img
                    alt="AI analyzing property"
                    className="object-cover w-full h-full"
                    src="https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?q=80&w=1200&auto=format&fit=crop"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Advanced AI Technology</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed">
                    Our proprietary AI has been trained on thousands of property inspections to deliver accurate results every time.
                  </p>
                </div>
                <ul className="grid gap-4">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span>Computer vision identifies items and assesses condition</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span>Natural language processing creates detailed descriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span>Machine learning improves with every inspection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span>Privacy-focused with secure data handling</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Free Trial Section */}
        <section id="pricing" className="bg-gradient-to-r from-verifyvision-gradient-start/10 to-verifyvision-gradient-end/10 py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start Your Free Trial Today</h2>
                <p className="max-w-[800px] text-gray-500 md:text-xl/relaxed">
                  Try our platform for 30 days with no obligation
                </p>
              </div>
              <div className="mx-auto w-full max-w-lg space-y-6">
                <div className="rounded-lg border bg-card p-8 shadow-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <h3 className="text-2xl font-bold">30-Day Free Trial</h3>
                    <div className="text-4xl font-bold">$0</div>
                    <p className="text-gray-500">No credit card details required</p>
                    <ul className="grid gap-2 text-left">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Full access to all features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Unlimited property inspections</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>PDF report generation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Email support</span>
                      </li>
                    </ul>
                    <Button size="lg" variant="gradient" className="w-full" asChild>
                      <Link to="/register" className="flex items-center justify-center gap-2">
                        Start Your Free Trial
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
                <p className="max-w-[800px] text-gray-500 md:text-xl/relaxed">
                  Hear from property managers and inspectors who've transformed their workflow
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="rounded-lg border bg-card p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-verifyvision-gradient-start to-verifyvision-gradient-end" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Johnson</p>
                      <p className="text-xs text-gray-500">Property Manager</p>
                    </div>
                  </div>
                  <p className="text-gray-500">
                    "This software has completely changed how we handle inspections. What used to take 2 hours now takes less than 45 minutes. The AI is impressively accurate."
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-verifyvision-gradient-start to-verifyvision-gradient-end" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Michael Rodriguez</p>
                      <p className="text-xs text-gray-500">Real Estate Inspector</p>
                    </div>
                  </div>
                  <p className="text-gray-500">
                    "The reports generated are incredibly professional, and the AI recognition saves me so much time on documentation. I can focus on what really matters."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Inspection Process?</h2>
                <p className="max-w-[800px] text-gray-500 md:text-xl/relaxed">
                  Join thousands of property professionals already using VerifyVision AI
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" variant="gradient" asChild>
                  <Link to="/register">Start Your Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
              <p className="text-sm text-gray-500">No credit card required. Cancel anytime.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-verifyvision-blue text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/14a8bc8f-617c-43d9-90e5-bdc8b7bf3749.png" 
                  alt="VerifyVision AI Logo" 
                  className="h-8 w-auto" 
                />
                <span className="text-xl font-bold">VerifyVision AI</span>
              </div>
              <p className="text-sm text-white/80">
                AI-powered property inspection reports
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-white/80 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-sm text-white/80 hover:text-white">Pricing</a></li>
                <li><a href="#testimonials" className="text-sm text-white/80 hover:text-white">Testimonials</a></li>
                <li><a href="#faq" className="text-sm text-white/80 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-sm text-white/80 hover:text-white">About Us</a></li>
                <li><a href="#blog" className="text-sm text-white/80 hover:text-white">Blog</a></li>
                <li><a href="#careers" className="text-sm text-white/80 hover:text-white">Careers</a></li>
                <li><a href="#contact" className="text-sm text-white/80 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#terms" className="text-sm text-white/80 hover:text-white">Terms of Service</a></li>
                <li><a href="#privacy" className="text-sm text-white/80 hover:text-white">Privacy Policy</a></li>
                <li><a href="#cookies" className="text-sm text-white/80 hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/60">
              &copy; {new Date().getFullYear()} VerifyVision AI. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#twitter" className="text-white/60 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#facebook" className="text-white/60 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#linkedin" className="text-white/60 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
