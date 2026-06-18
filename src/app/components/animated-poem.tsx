import { motion } from 'motion/react';

export function AnimatedPoem() {
  return (
    <div className="space-y-6 font-serif">
      <motion.p 
        className="text-xl sm:text-2xl text-gray-800 dark:text-[#F8FAFC] leading-relaxed italic" 
        style={{ lineHeight: '1.8' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0 }}
      >
        There is a world, a private world<br />
        That's scary and so sad<br />
        To those of us who view it from outside looking in<br />
        So undefined with questions open<br />
        And answers none to find<br />
        Sometimes we can't help, but just get a little mad
      </motion.p>
      
      <motion.p 
        className="text-xl sm:text-2xl text-gray-800 dark:text-[#F8FAFC] leading-relaxed italic" 
        style={{ lineHeight: '1.8' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        But there's a girl inside that world<br />
        Who tips it on its head<br />
        And changes up the scenery<br />
        To make that world not scary, and certainly not sad<br />
        She's brave and very patient, a gentle soul for sure<br />
        And hands out love to everyone she knows
      </motion.p>
      
      <motion.p 
        className="text-xl sm:text-2xl text-gray-800 dark:text-[#F8FAFC] leading-relaxed italic" 
        style={{ lineHeight: '1.8' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        Delaney's world is filled<br />
        With Angel kisses in the air<br />
        And Magic in the sky<br />
        Her happiness contagious<br />
        For everyone to try<br />
        Her eyes could melt an iceberg<br />
        And smiles can light a room<br />
        There is no hate in Laney's world<br />
        No jealousy or despair<br />
        She shares her world unselfishly<br />
        With tenderness and care
      </motion.p>
      
      <motion.p 
        className="text-xl sm:text-2xl text-gray-800 dark:text-[#F8FAFC] leading-relaxed italic" 
        style={{ lineHeight: '1.8' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        The future holds such hope and dreams<br />
        Don't ever count her out<br />
        For Laney is a fighter in every way it means
      </motion.p>
    </div>
  );
}
