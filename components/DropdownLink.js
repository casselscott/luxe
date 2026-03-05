import Link from "next/link";
import React from "react";

export default function DropdownLink(props) {
  let { href, children, ...rest } = props;
  return (
    <div className="block px-4 py-4 text-gray-200 hover:bg-gray-700">
      <Link href={href} legacyBehavior>
        <a {...rest}>{children}</a>
      </Link>
    </div>
  );
}
