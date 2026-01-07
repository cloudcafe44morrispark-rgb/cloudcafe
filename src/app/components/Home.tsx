import { HeroBanner } from './HeroBanner';
import { ProductSection } from './ProductSection';

export function Home() {
  return (
    <>
      <HeroBanner />
      
      {/* Caramel Protein Section */}
      <ProductSection
        imageUrl="https://images.unsplash.com/photo-1684439670717-b1147a7e7534?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VkJTIwY29mZmVlJTIwZHJpbmt8ZW58MXx8fHwxNzY3NzIxNjUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        imagePosition="left"
        backgroundColor="bg-[#B88A68]"
        title="Caramel protein is here"
        description="Power up with the new Caramel Protein Latte and Caramel Protein Matcha. Handcrafted with Protein-boosted Milk for up to 31 grams of protein per grande. Enjoy hot or iced with sugar-free options."
        buttonText="Explore caramel protein"
      />
      
      {/* Pistachio Section */}
      <ProductSection
        imageUrl="https://images.unsplash.com/photo-1729869257013-0ecac0b98164?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXN0YWNoaW8lMjBsYXR0ZSUyMGNvZmZlZXxlbnwxfHx8fDE3Njc3NDUzMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        imagePosition="right"
        backgroundColor="bg-gray-100"
        title="Hello, pistachio"
        titleColor="text-[#B88A68]"
        description="A beloved flavor is back with the delicious new Pistachio Cream Cold Brew and Pistachio Cream Shaken Espresso."
        buttonText="Learn more"
        buttonVariant="outline"
      />
    </>
  );
}