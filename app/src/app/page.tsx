"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Scan,
  Brain,
  FileText,
  ArrowRight,
  ChevronRight,
  Lock,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Scan,
    title: "Website Security Scanner",
    description:
      "Scan any website URL to analyze its security posture and detect vulnerabilities in real-time.",
    color: "#00f5d4",
  },
  {
    icon: AlertTriangle,
    title: "Vulnerability Detection",
    description:
      "Detect SQL Injection, XSS, missing security headers, authentication weaknesses, and misconfigurations.",
    color: "#ff6d00",
  },
  {
    icon: Brain,
    title: "AI Security Assistant",
    description:
      "AI explains vulnerability impact, attack scenarios, recommended fixes, and security best practices.",
    color: "#9b5de5",
  },
  {
    icon: FileText,
    title: "PDF Reports",
    description:
      "Generate downloadable reports with vulnerability details, severity levels, and recommendations.",
    color: "#00bbf9",
  },
];

const stats = [
  { value: "50+", label: "Vulnerability Checks" },
  { value: "< 30s", label: "Scan Duration" },
  { value: "AI", label: "Powered Analysis" },
  { value: "PDF", label: "Report Export" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-accent-cyan" />
              <div className="absolute inset-0 bg-accent-cyan/20 blur-lg rounded-full group-hover:bg-accent-cyan/30 transition-all" />
            </div>
            <span className="text-xl font-bold">
              Bug<span className="text-gradient">Hunter</span> AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="btn-secondary text-sm py-2.5 px-5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative pt-32 pb-20 px-6 overflow-hidden"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent-cyan/[0.03] blur-3xl" />
        <div className="absolute top-20 right-20 w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
        <div className="absolute top-40 left-20 w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-40 right-40 w-1 h-1 bg-accent-purple rounded-full animate-pulse delay-700" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-sm font-medium">
              <Zap className="w-4 h-4" /> AI-Powered Security Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight"
          >
            Detect. Analyze.{" "}
            <span className="text-gradient">Secure.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            BugHunter AI automatically scans websites for vulnerabilities,
            explains security risks in simple language, and provides
            actionable remediation steps.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="btn-primary text-base py-3.5 px-8 flex items-center gap-2 group"
            >
              Start Scanning Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary text-base py-3.5 px-8 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" /> Sign In
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            variants={fadeUp}
            className="mt-16 glass-card-static p-6 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-6"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-gradient">Stay Secure</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Professional-grade security assessments made accessible to every
              developer.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className="glass-card p-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                  }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Security Score Preview */}
      <motion.section
        className="py-20 px-6"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="glass-card p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Real-Time{" "}
                  <span className="text-gradient">Security Scoring</span>
                </h2>
                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                  Get instant security scores with detailed breakdowns. Track
                  your progress and compare scores over time.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      range: "90-100",
                      label: "Secure",
                      color: "#00e676",
                    },
                    {
                      range: "70-89",
                      label: "Medium Risk",
                      color: "#ffc400",
                    },
                    {
                      range: "0-69",
                      label: "High Risk",
                      color: "#ff1744",
                    },
                  ].map((level, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-lg"
                      style={{ background: `${level.color}08` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: level.color }}
                      />
                      <span className="font-mono font-semibold text-sm">
                        {level.range}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {level.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Gauge Preview */}
              <div className="flex items-center justify-center">
                <div className="score-gauge">
                  <svg width="220" height="220" viewBox="0 0 220 220">
                    <circle
                      cx="110"
                      cy="110"
                      r="95"
                      fill="none"
                      stroke="rgba(148,163,184,0.1)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="110"
                      cy="110"
                      r="95"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 95 * 0.87} ${2 * Math.PI * 95}`}
                    />
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#00f5d4" />
                        <stop offset="100%" stopColor="#00bbf9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="score-value">87</span>
                  <span className="score-label">Score</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-6"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.div
          variants={fadeUp}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to <span className="text-gradient">Secure</span> Your Apps?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Start scanning your websites for vulnerabilities today. No credit
            card required.
          </p>
          <Link
            href="/signup"
            className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-3 group"
          >
            Get Started Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-cyan" />
            <span className="font-semibold">BugHunter AI</span>
          </div>
          <p className="text-text-muted text-sm">
            © 2025 BugHunter AI. Making security accessible to every developer.
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-severity-low" />
            <span className="text-sm text-text-secondary">
              All scans are safe & non-intrusive
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
