import { Instagram, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h3 className="font-display text-2xl tracking-wider text-foreground">
          PINHEIRO'S BURGER
        </h3>
        <p className="mt-2 text-muted-foreground">
          🎸 Hambúrgueres com Alma Rock 🎸
        </p>
        
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href="https://instagram.com/pinheirosburger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-5 w-5" />
            @pinheirosburger
          </a>
        </div>
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Horário de funcionamento:</p>
          <p className="text-foreground">Terça a Domingo • 18h às 23h</p>
        </div>
        
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pinheiro's Burger. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
