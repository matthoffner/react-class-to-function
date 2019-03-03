// Remove { Component }
const removeComponentImport = (root, j) => {
  return root
    .find(j.ImportSpecifier, {
      imported: {
        type: "Identifier",
        name: "Component"
      }
    })
    .remove();
};

// Parse propTypes into constructor, move to bottom
const buildPropTypeConstructor = (root, j, path) => {
  let propTypes = "({";
  let staticPropTypes = `ReactExample.propTypes = {\n`;
  let staticDefaultProps = `ReactExample.defaultProps = {\n`;
  root.find(j.ClassProperty).forEach(path => {
    if (path.value.key.name === "propTypes") {
      const props = path.value.value.properties;
      for (let x = 0; x < props.length; x++) {
        propTypes = `${propTypes}${props[x].key.name}`;
        staticPropTypes = `${staticPropTypes}  ${props[x].key.name}: ${
          props[x].value.name
        }`;
        if (props.length - x > 1) {
          // avoid trailing comma
          propTypes = `${propTypes},`;
          staticPropTypes = `${staticPropTypes},\n`;
        }
      }
      staticPropTypes = `${staticPropTypes}\n};`;
      propTypes = `${propTypes}})`;
    }
    if (path.value.key.name === "defaultProps") {
      const defaultProps = path.value.value.properties;
      for (let y = 0; y < defaultProps.length; y++) {
        staticDefaultProps = `${staticDefaultProps}  ${
          defaultProps[y].key.name
        }: ${defaultProps[y].value.raw}`;
        if (defaultProps.length - y > 1) {
          // avoid trailing comma
          staticDefaultProps = `${staticDefaultProps},\n`;
        }
      }
      staticDefaultProps = `${staticDefaultProps}\n};`;
    }
  });
  return {
    staticDefaultProps,
    staticPropTypes,
    propTypes
  };
};

// Copied from jscodeshift examples
const replaceThisProps = (root, j) => {
  root
    .find(j.MemberExpression, {
      object: {
        type: "MemberExpression",
        object: { type: "ThisExpression" },
        property: { name: "props" }
      }
    })
    .filter(e => {
      const resolvedScope = e.scope.lookup(e.value.property.name);
      return resolvedScope == null;
    })
    .replaceWith(p => p.value.property);
};

export default function(fileinfo, api) {
  const j = api.jscodeshift;
  const source = fileinfo.source;
  const root = j(source);

  removeComponentImport(root, j);
  const {
    staticDefaultProps,
    staticPropTypes,
    propTypes
  } = await buildPropTypeConstructor(root, j, fileinfo.path);
  replaceThisProps(root, j);
  root.get().node.program.body.push(staticPropTypes);
  root.get().node.program.body.push(staticDefaultProps);
  root.find(j.ClassProperty).remove();
  root.get().node.program.body.forEach(node => {
    if (node.type === "ExportDefaultDeclaration") {
      node.declaration.body.body.push(
        node.declaration.body.body[0].value.body.body[0]
      );
      node.declaration.body.body.shift();
    }
  });
  return root.toSource();
}
