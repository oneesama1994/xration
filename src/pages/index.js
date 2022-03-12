import React, { useEffect, useState } from "react";
import { graphql, Link } from "gatsby";
import slugify from "slugify";

import { decryptBuffer, createBlobUrl } from "../utils/crypto";
import Layout from "../components/Layout";

import * as styles from "./index.module.css";

export default function PageIndex(props) {
  const { thumbnails } = props.data;
  const [urls, setUrls] = useState(
    [...Array(thumbnails.edges.length)].map(() => null)
  );

  useEffect(() => {
    (async () => {
      for (let i = 0; i < thumbnails.edges.length; i++) {
        const {
          node: { publicURL },
        } = thumbnails.edges[i];
        const res = await fetch(publicURL);
        const buffer = await res.arrayBuffer();
        const decryptedBuffer = decryptBuffer(buffer);
        const blobUrl = createBlobUrl(decryptedBuffer);
        setUrls((arr) =>
          arr.map((url, index) => (i === index ? blobUrl : url))
        );
      }
    })();

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
        {urls.map((url, index) =>
          url != null ? (
            <Link
              className={styles.thumbnail}
              to={`/${slugify(
                thumbnails.edges[index].node.relativePath
                  .split("/")[0]
                  .toLowerCase()
              )}`}
              key={index}
            >
              <img src={url} className={styles.thumbnailImage} />
            </Link>
          ) : null
        )}
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
