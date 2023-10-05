/* eslint-disable import/prefer-default-export */
export async function GET() {
  return Response.json(
    { success: false },
    {
      status: 422,
    },
  );
}
