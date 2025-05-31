"use client";
import { useEffect } from "react";

// Define the type for chatbase commands
type ChatbaseCommand = [command: string, ...args: unknown[]];

// Define the interface for the chatbase function
interface Chatbase {
  (...args: ChatbaseCommand): void;
  q?: ChatbaseCommand[];
  getState?: () => string;
}

// Extend the Window interface
declare global {
  interface Window {
    chatbase: Chatbase;
  }
}

const ChatBot = () => {
  useEffect(() => {
    if (!window.chatbase || window.chatbase.getState?.() !== "initialized") {
      // Initialize chatbase as a function that queues commands
      window.chatbase = (...args: ChatbaseCommand) => {
        if (!window.chatbase.q) {
          window.chatbase.q = [];
        }
        window.chatbase.q.push(args);
      };

      // Use Proxy to handle dynamic method calls
      window.chatbase = new Proxy(window.chatbase, {
        get(target, prop: keyof Chatbase) {
          if (prop === "q") {
            return target.q;
          }
          return (...args: unknown[]) => target(prop as string, ...args);
        },
      });
    }

    const onLoad = () => {
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "cO1mWB53OR4OWCM8BmKug";
      document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
};

export default ChatBot;
