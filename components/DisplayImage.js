import Image from "next/image";

export default function DisplayImage() {
  return (
    <>
      <div>
        <Image
          src={
            "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707846/image21_st7z4l.jpg"
          }
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={
            "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707781/image20_qbwn44.jpg"
          }
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={
            "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707769/image19_p5eqbk.jpg"
          }
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={
            "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707759/image18_vg9j1d.jpg"
          }
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
      <div>
        <Image
          src={
            "https://res.cloudinary.com/dxvfabxw8/image/upload/v1772707737/image17_q31e0p.jpg"
          }
          alt="Banner image"
          width={300}
          height={100}
        />
      </div>
    </>
  );
}
