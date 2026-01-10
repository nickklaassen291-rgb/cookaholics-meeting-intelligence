import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  CalendarDays,
  Upload,
  FileText,
  CheckSquare,
  Users,
  Bell,
  BarChart3,
  Settings,
  HelpCircle,
  PlayCircle,
  Mic,
  Brain,
  Mail,
  Building2,
  Shield,
  Clock,
} from "lucide-react";

interface SOPSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

const sopSections: SOPSection[] = [
  // VERGADERINGEN
  {
    id: "vergadering-aanmaken",
    title: "Een vergadering aanmaken",
    icon: <CalendarDays className="h-5 w-5" />,
    category: "Vergaderingen",
    description: "Hoe maak je een nieuwe vergadering aan in het systeem",
    steps: [
      {
        title: "Ga naar Vergaderingen",
        description: "Klik in de sidebar op 'Vergaderingen' of ga naar /vergaderingen",
      },
      {
        title: "Klik op 'Nieuwe Vergadering'",
        description: "Je vindt deze knop rechtsboven op de pagina",
      },
      {
        title: "Vul de basisgegevens in",
        description: "Voer de titel, datum, tijd en duur van de vergadering in",
      },
      {
        title: "Selecteer het type vergadering",
        description: "Kies uit Daily Standup, Weekly Meeting, Monthly Review, etc.",
        tip: "Het type bepaalt welk script er beschikbaar is",
      },
      {
        title: "Kies de afdeling",
        description: "Selecteer voor welke afdeling deze vergadering is",
      },
      {
        title: "Voeg deelnemers toe (optioneel)",
        description: "Selecteer de teamleden die deelnemen aan de vergadering",
      },
      {
        title: "Klik op 'Vergadering Aanmaken'",
        description: "De vergadering wordt opgeslagen en je wordt doorgestuurd naar de detailpagina",
      },
    ],
  },
  {
    id: "audio-uploaden",
    title: "Audio uploaden en transcriberen",
    icon: <Upload className="h-5 w-5" />,
    category: "Vergaderingen",
    description: "Hoe upload je een audio-opname en krijg je een transcriptie",
    steps: [
      {
        title: "Open de vergadering",
        description: "Ga naar de vergadering waarvoor je audio wilt uploaden",
      },
      {
        title: "Scroll naar 'Audio & Transcriptie'",
        description: "Je vindt dit onderdeel op de vergaderpagina",
      },
      {
        title: "Sleep je audiobestand of klik om te uploaden",
        description: "Ondersteunde formaten: MP3, WAV, M4A, WEBM (max 100MB)",
        tip: "Zorg voor een goede audiokwaliteit voor de beste transcriptie",
      },
      {
        title: "Wacht op de upload",
        description: "Je ziet een voortgangsbalk tijdens het uploaden",
      },
      {
        title: "Start de transcriptie",
        description: "Klik op 'Transcriberen' om de audio om te zetten naar tekst",
        tip: "Dit kan enkele minuten duren afhankelijk van de lengte",
      },
      {
        title: "Bekijk de transcriptie",
        description: "Na voltooiing verschijnt de volledige tekst op de pagina",
      },
    ],
  },
  {
    id: "samenvatting-genereren",
    title: "AI samenvatting genereren",
    icon: <Brain className="h-5 w-5" />,
    category: "Vergaderingen",
    description: "Hoe laat je AI een samenvatting maken van je vergadering",
    steps: [
      {
        title: "Zorg voor een transcriptie",
        description: "Upload eerst audio en laat deze transcriberen",
      },
      {
        title: "Klik op 'Samenvatten'",
        description: "Deze knop verschijnt zodra de transcriptie klaar is",
      },
      {
        title: "Wacht op de AI",
        description: "Claude analyseert de transcriptie en maakt een samenvatting",
        tip: "Dit duurt meestal 30-60 seconden",
      },
      {
        title: "Bekijk de resultaten",
        description: "Je krijgt: een samenvatting, actiepunten, en eventuele aandachtspunten (red flags)",
      },
      {
        title: "Controleer de actiepunten",
        description: "De AI extraheert automatisch actiepunten met verantwoordelijken",
        tip: "Controleer altijd of de actiepunten correct zijn geëxtraheerd",
      },
    ],
  },
  {
    id: "vergaderscript-gebruiken",
    title: "Vergaderscript gebruiken",
    icon: <FileText className="h-5 w-5" />,
    category: "Vergaderingen",
    description: "Hoe gebruik je een script om je vergadering te structureren",
    steps: [
      {
        title: "Open de vergadering",
        description: "Ga naar de vergadering die je wilt leiden",
      },
      {
        title: "Klik op 'Script bekijken'",
        description: "Je vindt dit bij de vergaderdetails",
      },
      {
        title: "Volg de secties",
        description: "Het script is opgedeeld in secties met tijdsindicaties",
        tip: "Houd de tijd in de gaten per sectie",
      },
      {
        title: "Gebruik de checklist",
        description: "Vink items af terwijl je door de vergadering gaat",
      },
      {
        title: "Print indien nodig",
        description: "Klik op 'Printen' voor een papieren versie",
      },
    ],
  },

  // ACTIEPUNTEN
  {
    id: "actiepunten-beheren",
    title: "Actiepunten beheren",
    icon: <CheckSquare className="h-5 w-5" />,
    category: "Actiepunten",
    description: "Hoe bekijk en beheer je actiepunten",
    steps: [
      {
        title: "Ga naar Actiepunten",
        description: "Klik in de sidebar op 'Actiepunten'",
      },
      {
        title: "Filter op status",
        description: "Gebruik de filters om te zoeken op Open, In Progress, of Voltooid",
      },
      {
        title: "Filter op afdeling of eigenaar",
        description: "Beperk de lijst tot specifieke afdelingen of personen",
      },
      {
        title: "Wijzig de status",
        description: "Klik op een actiepunt om de status te wijzigen",
        tip: "Sleep actiepunten tussen kolommen in de Kanban-weergave",
      },
      {
        title: "Stel een deadline in",
        description: "Klik op het kalendericoon om een deadline toe te voegen",
      },
      {
        title: "Wijs toe aan iemand",
        description: "Selecteer een eigenaar uit de dropdown",
      },
    ],
  },
  {
    id: "mijn-actiepunten",
    title: "Mijn actiepunten bekijken",
    icon: <CheckSquare className="h-5 w-5" />,
    category: "Actiepunten",
    description: "Hoe bekijk je alleen jouw eigen actiepunten",
    steps: [
      {
        title: "Ga naar 'Mijn Actiepunten'",
        description: "Klik in de sidebar op 'Mijn Actiepunten'",
      },
      {
        title: "Bekijk je openstaande taken",
        description: "Je ziet alleen actiepunten die aan jou zijn toegewezen",
      },
      {
        title: "Sorteer op deadline",
        description: "Klik op 'Deadline' om te sorteren op urgentie",
        tip: "Rode badges betekenen dat de deadline is verstreken",
      },
      {
        title: "Markeer als voltooid",
        description: "Klik op het vinkje om een actiepunt af te ronden",
      },
    ],
  },

  // RAPPORTAGES
  {
    id: "rapport-genereren",
    title: "Een rapport genereren",
    icon: <BarChart3 className="h-5 w-5" />,
    category: "Rapportages",
    description: "Hoe maak je week- of maandrapporten",
    steps: [
      {
        title: "Ga naar Rapportages",
        description: "Klik in de sidebar op 'Rapportages'",
      },
      {
        title: "Klik op 'Nieuw Rapport'",
        description: "Je vindt deze knop rechtsboven",
      },
      {
        title: "Kies het type rapport",
        description: "Selecteer: Weekrapport, Maandrapport, Afdelingsrapport, of MT-rapport",
      },
      {
        title: "Selecteer de periode",
        description: "Kies de start- en einddatum voor het rapport",
      },
      {
        title: "Selecteer de afdeling (indien van toepassing)",
        description: "Voor afdelingsrapporten, kies de betreffende afdeling",
      },
      {
        title: "Klik op 'Genereren'",
        description: "AI analyseert alle vergaderingen in de periode en maakt een rapport",
        tip: "Dit kan enkele minuten duren bij veel vergaderingen",
      },
      {
        title: "Bekijk en deel het rapport",
        description: "Je kunt het rapport bekijken, printen, of per email versturen",
      },
    ],
  },

  // MELDINGEN
  {
    id: "meldingen-beheren",
    title: "Meldingen beheren",
    icon: <Bell className="h-5 w-5" />,
    category: "Meldingen",
    description: "Hoe beheer je je notificaties",
    steps: [
      {
        title: "Ga naar Meldingen",
        description: "Klik op het belletje in de header of ga naar 'Meldingen' in de sidebar",
      },
      {
        title: "Bekijk je meldingen",
        description: "Je ziet meldingen voor nieuwe actiepunten, deadlines, en vergaderingen",
      },
      {
        title: "Markeer als gelezen",
        description: "Klik op een melding om deze als gelezen te markeren",
      },
      {
        title: "Pas voorkeuren aan",
        description: "Klik op het tandwiel om naar meldingsvoorkeuren te gaan",
      },
    ],
  },
  {
    id: "meldingsvoorkeuren",
    title: "Meldingsvoorkeuren instellen",
    icon: <Settings className="h-5 w-5" />,
    category: "Meldingen",
    description: "Hoe stel je in welke meldingen je ontvangt",
    steps: [
      {
        title: "Ga naar Instellingen > Meldingen",
        description: "Of klik op het tandwiel bij de meldingenpagina",
      },
      {
        title: "Email meldingen",
        description: "Kies welke meldingen je per email wilt ontvangen",
        tip: "Bijvoorbeeld: deadline herinneringen, nieuwe actiepunten",
      },
      {
        title: "In-app meldingen",
        description: "Kies welke meldingen je in de app wilt zien",
      },
      {
        title: "Stel timing in",
        description: "Bepaal hoeveel dagen voor een deadline je een herinnering wilt",
      },
      {
        title: "Klik op 'Opslaan'",
        description: "Je voorkeuren worden direct toegepast",
      },
    ],
  },

  // ZOEKEN
  {
    id: "zoeken",
    title: "Zoeken in vergaderingen",
    icon: <Search className="h-5 w-5" />,
    category: "Zoeken",
    description: "Hoe vind je snel informatie terug",
    steps: [
      {
        title: "Ga naar Zoeken",
        description: "Klik in de sidebar op 'Zoeken'",
      },
      {
        title: "Typ je zoekopdracht",
        description: "Zoek op trefwoorden, namen, of onderwerpen",
        tip: "Je kunt zoeken in titels, transcripties, en samenvattingen",
      },
      {
        title: "Gebruik filters",
        description: "Beperk resultaten tot specifieke afdelingen of periodes",
      },
      {
        title: "Bekijk resultaten",
        description: "Klik op een resultaat om naar de vergadering te gaan",
      },
    ],
  },

  // ADMIN
  {
    id: "gebruikers-uitnodigen",
    title: "Nieuwe gebruikers uitnodigen",
    icon: <Users className="h-5 w-5" />,
    category: "Beheer",
    description: "Hoe nodig je nieuwe teamleden uit",
    steps: [
      {
        title: "Ga naar Beheer > Gebruikers",
        description: "Je vindt dit in de sidebar onder 'Beheer'",
      },
      {
        title: "Klik op 'Uitnodigen'",
        description: "Je vindt deze knop rechtsboven",
      },
      {
        title: "Selecteer de afdeling",
        description: "Kies de afdeling waar de nieuwe gebruiker bij hoort",
      },
      {
        title: "Kopieer de uitnodigingslink",
        description: "Klik op 'Kopieer link'",
      },
      {
        title: "Deel de link",
        description: "Stuur de link naar je collega via email, Slack, of WhatsApp",
      },
      {
        title: "Collega maakt account aan",
        description: "Zij klikken op de link en maken een account aan",
        tip: "Ze worden automatisch aan de juiste afdeling toegevoegd",
      },
    ],
  },
  {
    id: "gebruiker-rol-wijzigen",
    title: "Gebruikersrol wijzigen",
    icon: <Shield className="h-5 w-5" />,
    category: "Beheer",
    description: "Hoe wijzig je de rol van een gebruiker",
    steps: [
      {
        title: "Ga naar Beheer > Gebruikers",
        description: "Je vindt dit in de sidebar onder 'Beheer'",
      },
      {
        title: "Zoek de gebruiker",
        description: "Gebruik de zoekbalk of scroll door de lijst",
      },
      {
        title: "Klik op 'Bewerken'",
        description: "Je vindt deze knop rechts van de gebruiker",
      },
      {
        title: "Selecteer de nieuwe rol",
        description: "Kies uit: Admin, Afdelingshoofd, of Medewerker",
        tip: "Admin = volledige toegang, Afdelingshoofd = eigen afdeling beheren",
      },
      {
        title: "Wijzig eventueel de afdeling",
        description: "Je kunt de gebruiker ook naar een andere afdeling verplaatsen",
      },
      {
        title: "Klik op 'Opslaan'",
        description: "De wijzigingen worden direct toegepast",
      },
    ],
  },
];

const categories = [...new Set(sopSections.map((s) => s.category))];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSections = sopSections.filter((section) => {
    const matchesSearch =
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.steps.some(
        (step) =>
          step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          step.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory = !selectedCategory || section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="h-8 w-8" />
            Handleiding
          </h1>
          <p className="text-muted-foreground mt-1">
            Stap-voor-stap instructies voor alle functies
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek in handleidingen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  Alles
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SOP Sections */}
        <div className="grid gap-4">
          {filteredSections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Geen handleidingen gevonden voor "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{section.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="steps" className="border-none">
                      <AccordionTrigger className="text-sm text-primary hover:no-underline">
                        <span className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Bekijk {section.steps.length} stappen
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="space-y-4 mt-4">
                          {section.steps.map((step, index) => (
                            <li key={index} className="flex gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="font-medium">{step.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {step.description}
                                </p>
                                {step.tip && (
                                  <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                                    <p className="text-sm text-amber-800">
                                      <span className="font-medium">Tip:</span> {step.tip}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle links</CardTitle>
            <CardDescription>Direct naar veelgebruikte functies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a
                href="/vergaderingen/nieuw"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <CalendarDays className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Nieuwe vergadering</span>
              </a>
              <a
                href="/actiepunten/mijn"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <CheckSquare className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Mijn actiepunten</span>
              </a>
              <a
                href="/rapportages"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Rapportages</span>
              </a>
              <a
                href="/zoeken"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Search className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Zoeken</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
