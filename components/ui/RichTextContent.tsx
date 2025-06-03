import { motion, TargetAndTransition, VariantLabels, Transition } from 'framer-motion';

interface RichTextContentProps {
  content: string;
  className?: string;
  animation?: {
    initial?: TargetAndTransition | VariantLabels;
    animate?: TargetAndTransition | VariantLabels;
    transition?: Transition;
  };
}

export const RichTextContent = ({ 
  content, 
  className = "", 
  animation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.6 }
  }
}: RichTextContentProps) => {
  const baseStyles = "text-lg text-white leading-relaxed text-justify prose prose-invert max-w-none [&_*]:text-white " +
    "[&_strong]:font-bold [&_em]:italic [&_u]:underline " +
    "[&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 " +
    "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 " +
    "[&_.font-arial]:font-['Arial'] " +
    "[&_.font-helvetica]:font-['Helvetica'] " +
    "[&_.font-times]:font-['Times_New_Roman'] " +
    "[&_.font-georgia]:font-['Georgia'] " +
    "[&_.font-courier]:font-['Courier_New'] " +
    "[&_.font-verdana]:font-['Verdana'] " +
    "[&_.font-tahoma]:font-['Tahoma'] " +
    "[&_.font-impact]:font-['Impact'] " +
    "[&_.text-12]:text-[12px] " +
    "[&_.text-14]:text-[14px] " +
    "[&_.text-18]:text-[18px] " +
    "[&_.text-20]:text-[20px] " +
    "[&_.text-24]:text-[24px] " +
    "[&_.text-28]:text-[28px] " +
    "[&_.text-32]:text-[32px] " +
    "[&_.text-36]:text-[36px] " +
    "[&_.text-42]:text-[42px]";

  return (
    <motion.div
      className={`${baseStyles} ${className}`}
      initial={animation.initial}
      animate={animation.animate}
      transition={animation.transition}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}; 