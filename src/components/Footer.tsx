import { Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-[#eeeeee]">
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-8">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[18px] font-semibold text-foreground">Crarity</div>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-[#eeeeee]" />

        {/* Copyright */}
        <p className="pt-5 text-center text-[12px] text-muted-foreground">
          © 2026 Crarity. All rights reserved. ·{" "}
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          {" · "}
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
