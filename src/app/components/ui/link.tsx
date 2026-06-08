import * as React from "react";

// Filter out Figma inspector props
const filterFigmaProps = (props: any) => {
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    ...cleanProps
  } = props;
  return cleanProps;
};

export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
  const cleanProps = filterFigmaProps(props);
  return <a ref={ref} {...cleanProps} />;
});

Link.displayName = "Link";
