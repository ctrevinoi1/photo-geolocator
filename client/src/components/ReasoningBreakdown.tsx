import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ReasoningBreakdownProps {
  reasoning: string[];
}

export function ReasoningBreakdown({ reasoning }: ReasoningBreakdownProps) {
  if (!reasoning || reasoning.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-reasoning">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Analysis Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="reasoning-chain">
          <AccordionItem value="reasoning-chain" className="border-none">
            <AccordionTrigger 
              className="text-sm hover:no-underline py-2"
              data-testid="button-toggle-reasoning"
            >
              <span className="text-muted-foreground">
                View detailed chain-of-thought analysis ({reasoning.length} steps)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-3 pt-2" data-testid="list-reasoning-steps">
                {reasoning.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed flex-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
