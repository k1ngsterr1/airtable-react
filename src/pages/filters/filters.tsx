import FiltersWidget from "@/widgets/ui/filters-widget/ui/filters-widget";
import { useParams } from "react-router";

export const FiltersPage = () => {
  const { id } = useParams();

  return (
    <>
      <FiltersWidget id={Number(id)} />
    </>
  );
};
