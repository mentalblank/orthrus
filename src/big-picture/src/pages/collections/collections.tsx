import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderIcon } from "@phosphor-icons/react";
import type { LibraryGame } from "@types";

import {
  FocusItem,
  ScrollArea,
  Typography,
  VerticalFocusGroup,
} from "../../components";
import {
  useGameCollections,
  useHeaderTitle,
  useLibrary,
  useNavigationScreenActions,
} from "../../hooks";
import { IS_DESKTOP } from "../../constants";
import {
  BP_COLLECTIONS_LIST_REGION_ID,
  BP_COLLECTIONS_PAGE_REGION_ID,
  getBpCollectionRowId,
} from "./navigation";
import "./collections.scss";

const getCollectionIds = (game: LibraryGame): string[] =>
  Array.isArray(game.collectionIds) ? game.collectionIds : [];

const getCover = (game: LibraryGame): string =>
  game.libraryHeroImageUrl || game.libraryImageUrl || game.iconUrl || "";

export default function Collections() {
  const navigate = useNavigate();
  const { collections, loadCollections } = useGameCollections();
  const { library } = useLibrary();

  useHeaderTitle("Collections");

  useNavigationScreenActions({
    press: {
      b: () => navigate(-1),
    },
  });

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const coverByCollection = useMemo(() => {
    const map = new Map<string, string>();

    for (const game of library) {
      const cover = getCover(game);
      if (!cover) continue;

      for (const id of getCollectionIds(game)) {
        if (!map.has(id)) map.set(id, cover);
      }
    }

    return map;
  }, [library]);

  const basePath = IS_DESKTOP ? "/big-picture" : "";

  return (
    <VerticalFocusGroup regionId={BP_COLLECTIONS_PAGE_REGION_ID} asChild>
      <div className="bp-collections">
        <Typography className="bp-collections__title">Collections</Typography>

        {collections.length === 0 ? (
          <Typography className="bp-collections__empty">
            No collections yet.
          </Typography>
        ) : (
          <ScrollArea className="bp-collections__scroll">
            <VerticalFocusGroup
              regionId={BP_COLLECTIONS_LIST_REGION_ID}
              asChild
            >
              <ul className="bp-collections__grid">
                {collections.map((collection) => {
                  const cover = coverByCollection.get(collection.id);

                  return (
                    <FocusItem
                      key={collection.id}
                      id={getBpCollectionRowId(collection.id)}
                      asChild
                    >
                      <li>
                        <button
                          type="button"
                          className="bp-collections__card"
                          onClick={() =>
                            navigate(`${basePath}/library?tab=${collection.id}`)
                          }
                        >
                          {cover ? (
                            <img
                              className="bp-collections__card-cover"
                              src={cover}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className="bp-collections__card-cover bp-collections__card-cover--placeholder">
                              <FolderIcon size={40} />
                            </div>
                          )}

                          <div className="bp-collections__card-overlay">
                            <span className="bp-collections__card-name">
                              {collection.name}
                            </span>
                            <span className="bp-collections__card-count">
                              {collection.gamesCount} games
                            </span>
                          </div>
                        </button>
                      </li>
                    </FocusItem>
                  );
                })}
              </ul>
            </VerticalFocusGroup>
          </ScrollArea>
        )}
      </div>
    </VerticalFocusGroup>
  );
}
