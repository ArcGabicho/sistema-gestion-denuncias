import { CheckCircle2 } from "lucide-react";
import { checklistItems } from "../constants/data";
import Image from "next/image";

const Workflow = () => {
  return (
    <div id="Mision" className="mt-20">
      <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center mt-6 tracking-wide">
        ¿Como nació {" "}
        <span className="bg-gradient-to-r from-red-500 to-red-800 text-transparent bg-clip-text">
          Perú Seguro?
        </span>
      </h2>
      <div className="flex flex-wrap justify-center">
        <div className="pt-8 md:py-20 px-4 w-full lg:w-1/2">
          <Image src="/assets/work.png" alt="work" className="rounded-xl w-1/2 h-full" layout="responsive" width={16} height={9} />
        </div>
        <div className="pt-8 md:py-20 w-full lg:w-1/2">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex mb-12">
              <div className="text-red-400 mx-6 bg-neutral-900 h-10 w-10 p-2 justify-center items-center rounded-full">
                <CheckCircle2 />
              </div>
              <div>
                <h5 className="mt-1 mb-2 text-xl">{item.title}</h5>
                <p className="text-md text-neutral-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workflow;
