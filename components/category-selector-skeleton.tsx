import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export function CategorySelectorSkeleton() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className='sticky top-0 z-10 w-full border-b border-muted/50 h-14 bg-background/80 backdrop-blur-xl shadow-sm'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      <div className='flex items-center h-full gap-3 px-4 md:px-6 md:justify-center overflow-x-auto'>
        {Array.from({ length: 6 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 500,
                damping: 30,
                delay: index * 0.03,
              },
            }}
            className='flex-none'
          >
            <Skeleton className='h-8 w-24 rounded-full' />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
