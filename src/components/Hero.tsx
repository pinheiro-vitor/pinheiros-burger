import { motion } from "framer-motion";
import heroBurger from "@/assets/hero-burger.jpg";
import logo from "@/assets/logo.jpeg";

export function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <img 
        src={heroBurger} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <img
            src={logo}
            alt="Pinheiro's Burger"
            className="h-28 w-28 rounded-full border-4 border-primary shadow-2xl shadow-primary/30 md:h-36 md:w-36"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display text-5xl tracking-wider text-foreground md:text-7xl"
        >
          PINHEIRO'S BURGER
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-3 text-lg text-muted-foreground md:text-xl"
        >
          🎸 Hambúrgueres com Alma Rock 🎸
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4"
        >
          <StoreStatus />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-muted-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StoreStatus() {
  // Você pode ajustar esses horários conforme necessário
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Horário de funcionamento: Terça a Domingo, 18h às 23h
  const isOpen = day >= 2 && day <= 6 && hour >= 18 && hour < 23;
  const isSunday = day === 0;
  const isMonday = day === 1;
  
  let statusText = "Fechado";
  if (isOpen) {
    statusText = "Aberto agora";
  } else if (isMonday) {
    statusText = "Fechado · Abre terça 18h";
  } else if (isSunday) {
    statusText = "Fechado · Abre às 18h";
  } else if (hour < 18) {
    statusText = "Fechado · Abre às 18h";
  } else {
    statusText = "Fechado";
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
        isOpen
          ? "bg-green-500/20 text-green-400"
          : "bg-primary/20 text-primary"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOpen ? "animate-pulse bg-green-400" : "bg-primary"
        }`}
      />
      {statusText}
    </div>
  );
}
