import defineScreenshot from "@/assets/define-screenshot.png";
import evaluateScreenshot from "@/assets/evaluate-screenshot.png";
import decideScreenshot from "@/assets/decide-screenshot.png";

const steps = [
  {
    number: 1,
    title: "Define your requirements",
    description: "Set your role type, experience level, and create customized skill assessments",
    image: defineScreenshot,
  },
  {
    number: 2,
    title: "Evaluate candidates",
    description: "We evaluate candidates based on the industry bar",
    image: evaluateScreenshot,
  },
  {
    number: 3,
    title: "Make informed decisions",
    description: "Review detailed profiles, assessment scores, video intros, and portfolios",
    image: decideScreenshot,
  },
];

const HowItWorksFlowchart = () => {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">How it works</h2>
          <p className="text-lg text-muted-foreground">Three simple steps to better hiring decisions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col">
              {/* Screenshot */}
              <div className="mb-6 overflow-hidden rounded-xl border border-border shadow-lg group cursor-pointer">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm mb-3">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksFlowchart;
