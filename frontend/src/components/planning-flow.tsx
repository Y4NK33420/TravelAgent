import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { PlanningInterface } from './planning-interface';
import { PlacesToVisitSection } from './planning-sections/places-to-visit';
import { AccommodationsSection } from './planning-sections/accommodations';
import { DiningSection } from './planning-sections/dining';
import { TransportationSection } from './planning-sections/transportation';
import { ActivitiesSection } from './planning-sections/activities';
import { ShoppingSection } from './planning-sections/shopping';
import { EntertainmentSection } from './planning-sections/entertainment';
import { WellnessSection } from './planning-sections/wellness';

interface PlanningFlowProps {
  initialData?: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

const planningSteps = [
  { id: 'questionnaire', name: 'Tell Us About Your Trip', component: PlanningInterface },
  { id: 'places', name: 'Places to Visit', component: PlacesToVisitSection },
  { id: 'accommodations', name: 'Accommodations', component: AccommodationsSection },
  { id: 'dining', name: 'Dining', component: DiningSection },
  { id: 'transportation', name: 'Transportation', component: TransportationSection },
  { id: 'activities', name: 'Activities & Adventures', component: ActivitiesSection },
  { id: 'shopping', name: 'Shopping & Markets', component: ShoppingSection },
  { id: 'entertainment', name: 'Entertainment', component: EntertainmentSection },
  { id: 'wellness', name: 'Wellness & Relaxation', component: WellnessSection },
];

export function PlanningFlow({ initialData, onComplete, onBack }: PlanningFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [planningData, setPlanningData] = useState<any>({
    query: initialData?.query || '',
    destination: initialData?.destination || null,
    tripStyle: 'balanced', // laid-back, balanced, adventurous
    selectedItems: {},
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentStepData = planningSteps[currentStep];
  const CurrentComponent = currentStepData.component;
  


  const handleNext = () => {
    if (currentStep < planningSteps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      // Complete planning
      console.log('Planning completed with data:', planningData);
      onComplete(planningData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      onBack();
    }
  };

  const handleSectionComplete = (sectionData: any) => {
    console.log('Section completed:', currentStepData.id, sectionData);
    
    if (currentStepData.id === 'questionnaire') {
      // Handle questionnaire completion
      const updatedData = {
        ...planningData,
        ...sectionData,
        tripStyle: sectionData.tripStyle || 'balanced' // Extract trip style from questionnaire
      };
      console.log('Updated planning data after questionnaire:', updatedData);
      setPlanningData(updatedData);
      
      // Automatically move to the next step after questionnaire completion
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(1); // Move to first planning section (places)
        setIsTransitioning(false);
      }, 500); // Small delay for smooth transition
    } else {
      // Handle specialized section completion
      const updatedData = {
        ...planningData,
        selectedItems: {
          ...planningData.selectedItems,
          [currentStepData.id]: sectionData
        }
      };
      console.log('Updated planning data after section:', updatedData);
      setPlanningData(updatedData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with progress */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 0 ? 'Back to Home' : 'Previous'}
            </Button>

            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              {planningSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`w-3 h-3 rounded-full ${
                    index <= currentStep ? 'bg-blue-400' : 'bg-white/20'
                  }`}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                    opacity: index <= currentStep ? 1 : 0.5
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>

            <div className="text-white">
              <span className="text-sm opacity-70">Step {currentStep + 1} of {planningSteps.length}</span>
            </div>
          </div>

          {/* Step title */}
          <motion.h1
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl text-white mt-4"
          >
            {currentStepData.name}
          </motion.h1>
        </div>
      </motion.div>

      {/* Main content */}
      <div className={`pt-32 ${currentStepData.id === 'questionnaire' ? 'pb-8' : 'pb-24'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="container mx-auto px-6"
          >
            {currentStepData.id === 'questionnaire' ? (
              <CurrentComponent
                onComplete={handleSectionComplete}
                onClose={() => {}} // No close for questionnaire in flow
                initialData={planningData}
              />
            ) : (
              <CurrentComponent
                planningData={planningData}
                onSelectionChange={handleSectionComplete}
                isTransitioning={isTransitioning}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer with navigation - hide during questionnaire */}
      {currentStepData.id !== 'questionnaire' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-t border-white/10"
        >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-white/70 text-sm">
              Choose the options that appeal to you most
            </div>
            
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isTransitioning}
            >
              {currentStep === planningSteps.length - 1 ? 'Complete Planning' : 'Next Section'}
              {currentStep !== planningSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
              {currentStep === planningSteps.length - 1 && <Check className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
        </motion.div>
      )}
    </div>
  );
}