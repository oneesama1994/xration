import React, { useEffect, useState } from "react";
import { graphql, Link } from "gatsby";
import slugify from "slugify";

import { decryptBuffer, createBlobUrl } from "../utils/crypto";
import { fetchWithRetries } from "../utils/fetch";
import Layout from "../components/Layout";

import * as styles from "./index.module.css";

export default function PageIndex(props) {
  const { thumbnails } = props.data;
  const [urls, setUrls] = useState(
    [...Array(thumbnails.edges.length)].map(() => null)
  );

  useEffect(() => {
    async function loadImage(index) {
      const {
        node: { publicURL },
      } = thumbnails.edges[index];

      const res = await fetchWithRetries(publicURL, 1000, 5);
      const buffer = await res.arrayBuffer();
      const decryptedBuffer = decryptBuffer(buffer);
      const blobUrl = createBlobUrl(decryptedBuffer);
      setUrls((arr) => arr.map((url, i) => (i === index ? blobUrl : url)));
    }
    Promise.all(thumbnails.edges.map((_, index) => loadImage(index)));

    return () => {
      for (const url of urls) {
        if (url != null) {
          URL.revokeObjectURL(url);
        }
      }
    };
  }, []);

  return (
    <Layout>
      <div className={styles.container}>
        {urls.map((url, index) => {
          const {
            node: { relativePath, name },
          } = thumbnails.edges[index];
          const [_, width, height] = name.split("-");

          return (
            <Link
              className={styles.thumbnail}
              to={`/${slugify(relativePath.split("/")[0].toLowerCase())}`}
              key={index}
            >
              <div
                style={{
                  paddingTop: `${
                    (parseInt(height, 10) * 100) / parseInt(width, 10)
                  }%`,
                }}
              />
              {url != null ? (
                <img src={url} className={styles.thumbnailImage} />
              ) : null}
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    thumbnails: allFile(
      sort: { fields: dir }
      filter: { name: { regex: "/^thumbnail/" } }
    ) {
      edges {
        node {
          publicURL
          relativePath
          name
        }
      }
    }
  }
`;
