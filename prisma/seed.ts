import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = [
    {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
    },
    {
      name: 'Clothing',
      description: 'Apparel and fashion items',
    },
    {
      name: 'Books',
      description: 'Books and educational materials',
    },
    {
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
    },
  ];

  console.log('Creating categories...');
  const createdCategories: Array<{
    id: number;
    name: string;
    description: string | null;
  }> = [];
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {},
      create: categoryData,
    });
    createdCategories.push(category);
    console.log(`✓ Created category: ${category.name}`);
  }

  // Create suppliers
  const suppliers = [
    {
      name: 'Tech Solutions Inc.',
      email: 'contact@techsolutions.com',
      phone: '+1-555-0123',
      address: '123 Tech Street, Silicon Valley, CA 95014',
      contactPerson: 'John Smith',
    },
    {
      name: 'Fashion Forward LLC',
      email: 'orders@fashionforward.com',
      phone: '+1-555-0124',
      address: '456 Fashion Ave, New York, NY 10001',
      contactPerson: 'Sarah Johnson',
    },
    {
      name: 'Book World Distribution',
      email: 'wholesale@bookworld.com',
      phone: '+1-555-0125',
      address: '789 Book Lane, Chicago, IL 60601',
      contactPerson: 'Michael Davis',
    },
  ];

  console.log('Creating suppliers...');
  const createdSuppliers: Array<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    email: string | null;
    phone: string | null;
    address: string | null;
    contactPerson: string | null;
  }> = [];
  for (const supplierData of suppliers) {
    const supplier = await prisma.supplier.upsert({
      where: { email: supplierData.email },
      update: {},
      create: supplierData,
    });
    createdSuppliers.push(supplier);
    console.log(`✓ Created supplier: ${supplier.name}`);
  }

  // Create sample products
  const products = [
    {
      name: 'Laptop Dell XPS 13',
      description: 'High-performance laptop with Intel i7 processor',
      sku: 'DELL-XPS13-001',
      barcode: '1234567890001',
      price: 1299.99,
      costPrice: 999.99,
      stock: 15,
      minStock: 5,
      maxStock: 50,
      unitOfMeasure: 'pcs',
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[0].id,
    },
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with USB receiver',
      sku: 'MOUSE-WL-001',
      barcode: '1234567890002',
      price: 29.99,
      costPrice: 19.99,
      stock: 50,
      minStock: 10,
      maxStock: 100,
      unitOfMeasure: 'pcs',
      categoryId: createdCategories[0].id, // Electronics
      supplierId: createdSuppliers[0].id,
    },
    {
      name: 'Cotton T-Shirt',
      description: '100% cotton comfortable t-shirt',
      sku: 'TSHIRT-COT-001',
      barcode: '1234567890003',
      price: 19.99,
      costPrice: 12.99,
      stock: 100,
      minStock: 20,
      maxStock: 200,
      unitOfMeasure: 'pcs',
      categoryId: createdCategories[1].id, // Clothing
      supplierId: createdSuppliers[1].id,
    },
    {
      name: 'Programming Guide',
      description: 'Complete guide to modern programming',
      sku: 'BOOK-PROG-001',
      barcode: '1234567890004',
      price: 49.99,
      costPrice: 29.99,
      stock: 25,
      minStock: 5,
      maxStock: 50,
      unitOfMeasure: 'pcs',
      categoryId: createdCategories[2].id, // Books
      supplierId: createdSuppliers[2].id,
    },
  ];

  console.log('Creating products...');
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });
    console.log(`✓ Created product: ${product.name}`);
  }

  // Create sample customers
  const customers = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-1001',
      address: '123 Main St, Anytown, USA 12345',
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1-555-1002',
      address: '456 Oak Ave, Somewhere, USA 67890',
    },
    {
      name: 'Carol Brown',
      email: 'carol@example.com',
      phone: '+1-555-1003',
      address: '789 Pine Rd, Elsewhere, USA 54321',
    },
  ];

  console.log('Creating customers...');
  for (const customerData of customers) {
    const customer = await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    });
    console.log(`✓ Created customer: ${customer.name}`);
  }

  // Create admin user
  const adminUser = {
    email: 'admin@inventory.com',
    name: 'System Administrator',
    password: '$2a$10$8qvWzjGjNYZ.7qUm0c4qBeLb1EjRKFYKUK5Y6J.qB9IFMtM0EQIIe', // password: admin123
    role: 'ADMIN' as const,
  };

  console.log('Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {},
    create: adminUser,
  });
  console.log(`✓ Created admin user: ${admin.email} (password: admin123)`);

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Suppliers: ${suppliers.length}`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Customers: ${customers.length}`);
  console.log(`- Admin user: ${adminUser.email} (password: admin123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
