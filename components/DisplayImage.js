import Image from "next/image";

export default function DisplayImage() {
  return (
    <>
      <div>
        <Image
          src={"/images/image17.jpg"}
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={"/images/image18.jpg"}
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={"/images/image22.jpg"}
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={"/images/image20.jpg"}
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={"/images/image21.jpg"}
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
    </>
  );
}
