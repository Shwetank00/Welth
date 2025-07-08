"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
  const imageRef = useRef();

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl lg:text-[105px] gradient-title pb-6">
          Manage Your Finances <br />
          With Intelligence
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Welth is n AI powered personal finance management app that helps you
          track your expenses, set budgets, analyse your spendings with real
          time insights and achieve your financial goals.
        </p>

        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>

          <Link href="/">
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </Link>
        </div>
        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.jpeg"
              alt="Dashboard Preview"
              width={1280}
              height={720}
              className="rounded-lg shadow-2xl border-2 mx-auto"
            ></Image>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
